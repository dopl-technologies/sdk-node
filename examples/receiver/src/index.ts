import { TeleroboticSDK, Protos } from '@dopl-technologies/telerobotic-sdk'

const onSessionJoined = (sessionId: string | number) => {
    console.log("Session joined", sessionId);
}

const onSessionEnded = (sessionId: string | number) => {
    console.log("Session ended", sessionId);
}

const getFrame = (): Protos.CommonProtos.Frame => {
    const frame = new Protos.CommonProtos.Frame()
    return null
}

const onFrame = (frame: Protos.CommonProtos.Frame): boolean => {
    console.log(frame)
    return true
}

const sdk = new TeleroboticSDK(__dirname + '/../.dopltech.yml',
    onSessionJoined,
    onSessionEnded,
    getFrame,
    onFrame,
)

sdk.connect()