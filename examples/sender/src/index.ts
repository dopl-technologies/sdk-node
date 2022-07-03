import { TeleroboticSDK, Protos } from '@dopl-technologies/telerobotic-sdk'

const onSessionJoined = (sessionId: string | number) => {
    console.log("Session joined", sessionId);
}

const onSessionEnded = (sessionId: string | number) => {
    console.log("Session ended", sessionId);
}

const getFrame = (): Protos.CommonProtos.Frame => {
    const frame = new Protos.CommonProtos.Frame()

    // Add a single catheter point
    {
        const catheterData = new Protos.CommonProtos.CatheterData()

        const catheterCoordinates = new Protos.CommonProtos.CatheterCoordinates()
        catheterData.setCoordinates(catheterCoordinates)

        const position = new Protos.CommonProtos.Coordinates()
        position.setX(0)
        position.setY(1)
        position.setZ(2)

        const rotation = new Protos.CommonProtos.Quaternion
        rotation.setX(0)
        rotation.setY(1)
        rotation.setZ(2)
        rotation.setW(1)

        catheterCoordinates.setPosition(position)
        catheterCoordinates.setRotation(rotation)
    
        frame.addCatheterdata(catheterData)
    }

    // Add robotic controls
    const roboticControls = new Protos.CommonProtos.RobotControllerData()
    roboticControls.setMovementvelocity(1)
    roboticControls.setRotationvelocity(-1)
    roboticControls.setDeflectionvelocity(-0.5)
    frame.setRobotcontrollerdata(roboticControls)

    // Add Electrical signals
    const signal = new Protos.CommonProtos.ElectricalSignalData()
    signal.setValue(0.01)
    frame.addElectricalsignals(signal)

    return frame
}

const onFrame = (frame: Protos.CommonProtos.Frame): boolean => {
    return true
}

const sdk = new TeleroboticSDK(__dirname + '/../.dopltech.yml',
    onSessionJoined,
    onSessionEnded,
    getFrame,
    onFrame,
)

sdk.connect()