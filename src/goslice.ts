import Ref from "ref-napi"
import Struct from "ref-struct-napi"
import ArrayType from "ref-array-napi"

export const UInt64Array = ArrayType(Ref.types.uint64)

/*
 * GoSlice ABI-compliant struct
 * See https://github.com/golang/go/wiki/cgo#turning-c-arrays-into-go-slices
 */
const goSlice = Struct({
    data: UInt64Array,
    len: Ref.types.int64,
    cap: Ref.types.int64,
})

export class GoSlice extends goSlice {
    // GoSlice (cgo) -> JavaScript array
    static get(buffer: Buffer, offset: number) {
        return null // ?
    }

    // JavaScript array -> GoSlice (cgo)
    static set(buffer: Buffer, offset: number, value: any[]) {
        const _gs = new goSlice({
            data: value,
            len: value.length,
            cap: value.length,
        });
        return goSlice.set(buffer, offset, _gs);
    }
}