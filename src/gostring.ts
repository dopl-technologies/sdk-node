import Ref from "ref-napi"
import Struct from "ref-struct-napi"

/*
 * GoString ABI-compliant struct
 * See https://github.com/golang/go/wiki/cgo#go-strings-and-c-strings
 */
const goString = Struct({
    p: Ref.types.CString,
    n: Ref.types.int64,
})

export default class GoString extends goString {
    // GoString (cgo) -> JavaScript string
    static get(buffer: Buffer, offset: number) {
        const _gs: GoString = goString.get(buffer, offset);
        return _gs.p.slice(0, _gs.n);
    }

    // JavaScript string -> GoString (cgo)
    static set(buffer: Buffer, offset: number, value: string) {
        const _gs = new goString({
            p: value,
            n: value.length,
        });
        return goString.set(buffer, offset, _gs);
    }
}