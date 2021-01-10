import FFI from "ffi"
import Ref from "ref"
import Struct from "ref-struct"
import ArrayType from "ref-array"

import CommonProtos from "@dopl-technologies/api-protos/common_pb"
import logger from './winston'

import GoString from './gostring'
import { GoSlice, UInt64Array } from './goslice'

const libsdkPath = __dirname + "/bin/libsdk"

// This creates a view on top of the data that is of sufficient size
// to accommodate all the data that's coming from the sdk
const UCharArray = Ref.refType(ArrayType(Ref.types.uchar, 1000))

const onSession = FFI.Function(Ref.types.void, [Ref.types.uint64])
const getFrame = FFI.Function(Ref.types.bool, [UCharArray, Ref.refType(Ref.types.int)])
const onFrame = FFI.Function(Ref.types.bool, [UCharArray, Ref.types.int])

const sdk = FFI.Library(libsdkPath, {
    "libsdk_test": [ Ref.types.int, [] ],
    "libsdk_initialize": [Ref.types.void, [GoString, GoString, GoString, Ref.types.uint64, Ref.types.uint32, GoString, GoSlice, GoSlice, onSession, onSession, getFrame, onFrame, Ref.types.uint64, Ref.types.int]],
    "libsdk_connect": [Ref.types.void, [Ref.types.uint64]],
})

export default class Sdk {
    _deviceServiceAddress: string
    _sessionServiceAddress: string
    _stateManagerServiceAddress: string
    _deviceID: number
    _devicePort: number
    _deviceIP: string
    _produces: number[]
    _consumes: number[]
    _onSessionJoined: (sessionID: number) => void
    _onSessionEnded: (sessionID: number) => void
    _getFrameCallback: () => CommonProtos.Frame
    _onFrameCallback: (frame: CommonProtos.Frame) => boolean
    _sessionID: number
    _getFrameFreq: number

    _handleGetFrameCallback: any
    _handleOnFrameCallback: any

    constructor(deviceServiceAddress: string,
        sessionServiceAddress: string,
        stateManagerServiceAddress: string,
        deviceID: number,
        devicePort: number,
        deviceIP: string,
        produces: number[],
        consumes: number[],
        onSessionJoined: (sessionID: number) => void,
        onSessionEnded: (sessionID: number) => void,
        getFrameCallback: () => CommonProtos.Frame,
        onFrameCallback: (frame: CommonProtos.Frame) => boolean,
        sessionID: number = 0,
        getFrameFreq = 30) {
            this._deviceServiceAddress = deviceServiceAddress
            this._sessionServiceAddress = sessionServiceAddress
            this._stateManagerServiceAddress = stateManagerServiceAddress
            this._deviceID = deviceID
            this._devicePort = devicePort
            this._deviceIP = deviceIP
            this._produces = produces
            this._consumes = consumes
            this._onSessionJoined = onSessionJoined
            this._onSessionEnded = onSessionEnded
            this._getFrameCallback = getFrameCallback
            this._onFrameCallback = onFrameCallback
            this._sessionID = sessionID
            this._getFrameFreq = getFrameFreq

            this._handleGetFrameCallback = this.handleGetFrame.bind(this)
            this._handleOnFrameCallback = this.handleOnFrame.bind(this)

            sdk.libsdk_initialize(
                this._deviceServiceAddress,
                this._sessionServiceAddress,
                this._stateManagerServiceAddress,
                this._deviceID,
                this._devicePort,
                this._deviceIP,
                UInt64Array(this._produces),
                UInt64Array(this._consumes),
                this._onSessionJoined,
                this._onSessionEnded,
                this._handleGetFrameCallback,
                this._handleOnFrameCallback,
                this._sessionID,
                this._getFrameFreq,
            )
        }
    static test(): number {
        return sdk.libsdk_test()
    }

    connect(): Promise<void> {
        return new Promise((resolve: (value?: void) => void, reject: (reason: any) => void) => {
            sdk.libsdk_connect.async(this._deviceID, (err: any, res: any) => {
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

        const frame = CommonProtos.Frame.deserializeBinary(bufferUInt8)
        return this._onFrameCallback(frame)
    }
}