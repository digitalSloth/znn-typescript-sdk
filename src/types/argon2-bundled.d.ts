declare module "argon2-browser/dist/argon2-bundled.min.js" {
    import type { hash, ArgonType } from "argon2-browser";
    const argon2: { hash: typeof hash; ArgonType: typeof ArgonType };
    export default argon2;
}
