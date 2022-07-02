import FFI from "ffi-napi"
import Ref from "ref-napi"
import Struct from "ref-struct-napi"
import ArrayType from "ref-array-napi"
import os from 'os'

import * as Protos from "@dopl-technologies/api-protos"
import logger from './winston'

import GoString from './gostring'
import { GoSlice, UInt64Array } from './goslice'
import { config } from "winston"

const libsdkPath = __dirname + "/bin/libsdk_amd64"

// This creates a view on top of the data that is of sufficient size
// to accommodate all the data that's coming from the sdk
const UCharArray = Ref.refType(ArrayType(Ref.types.uchar, 1000))

const onSession = FFI.Function(Ref.types.void, [Ref.types.uint64])
const getFrame = FFI.Function(Ref.types.bool, [UCharArray, Ref.refType(Ref.types.int)])
const onFrame = FFI.Function(Ref.types.bool, [UCharArray, Ref.types.int])

const sdk = FFI.Library(libsdkPath, {
    "libsdk_test": [ Ref.types.int, [] ],
    "libsdk_initialize": [Ref.types.int, [GoString, onSession, onSession, getFrame, onFrame]],
    "libsdk_connect": [Ref.types.int, []],
})

class TeleroboticSDK {
    _configFilePath: string
    _onSessionJoined: (sessionID: string | number) => void
    _onSessionEnded: (sessionID: string | number) => void
    _getFrameCallback: () => Protos.CommonProtos.Frame
    _onFrameCallback: (frame: Protos.CommonProtos.Frame) => boolean

    _handleGetFrameCallback: any
    _handleOnFrameCallback: any

    constructor(configFilePath: string,
        onSessionJoined: (sessionID: string | number) => void,
        onSessionEnded: (sessionID: string | number) => void,
        getFrameCallback: () => Protos.CommonProtos.Frame,
        onFrameCallback: (frame: Protos.CommonProtos.Frame) => boolean) {
            this._configFilePath = configFilePath
            this._onSessionJoined = onSessionJoined
            this._onSessionEnded = onSessionEnded
            this._getFrameCallback = getFrameCallback
            this._onFrameCallback = onFrameCallback

            this._handleGetFrameCallback = this.handleGetFrame.bind(this)
            this._handleOnFrameCallback = this.handleOnFrame.bind(this)

            sdk.libsdk_initialize(
                this._configFilePath,
                this._onSessionJoined,
                this._onSessionEnded,
                this._handleGetFrameCallback,
                this._handleOnFrameCallback,
            )
        }
    static test(): number {
        return sdk.libsdk_test()
    }

    connect(): Promise<void> {
        return new Promise((resolve: (value?: void) => void, reject: (reason: any) => void) => {
            sdk.libsdk_connect.async((err: any, res: any) => {
                if(err) {
                    reject(err)
                }

                resolve()
            })
        })
    }

    private handleGetFrame(buffer: Buffer, bufferSizePtr: number[]): boolean {
        const frame = this._getFrameCallback()
        const frameBuffer = frame.serializeBinary()

        // Copy bytes from the frame to the given buffer
        //
        // A UInt8 is the size of a byte. We create a UInt8 view, or wrapper, around the array
        // so that we write a single byte at a time. In NodeJS, the C block of memory for the array is referenced by
        // buffer.buffer, which is a NodeJS ArrayBuffer Type. After we create a UInt8 view on top of the ArrayBuffer
        // we can begin writing to it, byte by byte
        const bufferUInt8 = new Uint8Array(buffer.buffer, 0, frameBuffer.buffer.byteLength)
        for(let i = 0; i < frameBuffer.length; i++) {
            bufferUInt8[i] = frameBuffer[i]
        }

        bufferSizePtr[0] = frameBuffer.length
        return true
    }

    private handleOnFrame(buffer: any, bufferSize: number): boolean {
        // Create an appropriately sized Uint8Array view on top of the buffer
        const bufferUInt8 = new Uint8Array(buffer.buffer, 0, bufferSize)

        const frame = Protos.CommonProtos.Frame.deserializeBinary(bufferUInt8)
        return this._onFrameCallback(frame)
    }
}

export {
    Protos,
    TeleroboticSDK,
}