import CryptoES from 'crypto-es';

const decrypt = function (ciphertext: string, iv: string, t: number): string {
    try {
        const key = generateKey(t);
        const decrypted = CryptoES.AES.decrypt(ciphertext, CryptoES.Utf8.parse(key), {
            iv: CryptoES.Hex.parse(iv),
            mode: CryptoES.CBC,
            padding: CryptoES.Pkcs7
        });
        const dec = CryptoES.Utf8.stringify(decrypted).toString();
        return dec;
    } catch (error) {
        console.error("Decryption failed", error);
        throw error;
    }
};

function h(charArray: string[], modifier: number): string {
    const uniqueChars = Array.from(new Set(charArray));
    const numericModifier = Number(modifier.toString().slice(7));
    const transformedString = uniqueChars.map(char => {
        const charCode = char.charCodeAt(0);
        let newCharCode = Math.abs(charCode - (numericModifier % 127) - 1);
        if (newCharCode < 33) {
            newCharCode += 33;
        }
        return String.fromCharCode(newCharCode);
    }).join("");

    return transformedString;
}

function getParams(t: number): Record<string, string | number> {
    return {
        'akv': '2.8.1496',
        'apv': '1.3.6',
        'b': 'XiaoMi',
        'd': '23046RP50C',
        'mac': '',
        'n': '23046RP50C',
        't': t,
        'wifiMac': '020000000000',
    };
}

const generateKey = function (t: number): string {
    const params = getParams(t);
    const sortedKeys = Object.keys(params).sort();
    let concatenatedParams = "";

    sortedKeys.forEach(key => {
        if (key !== "t") {
            concatenatedParams += params[key];
        }
    });

    const keyArray = concatenatedParams.split("");
    const hashedKey = h(keyArray, t);
    return CryptoES.MD5(hashedKey).toString(CryptoES.Hex);
};

export { decrypt, getParams };
