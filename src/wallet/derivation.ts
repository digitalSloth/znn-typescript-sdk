export class Derivation {
    static coinType: string = "73404";
    static derivationPath: string = `m/44'/${this.coinType}'`;

    public static getDerivationAccount(account: number = 0): string {
        return Derivation.derivationPath + `/${account}'`;
    }
}
