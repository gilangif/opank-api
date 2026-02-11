const urlParser = (text, special) => {
  try {
    const today = new Date()
    const tomorrow = new Date(new Date().setDate(new Date().getDate() + 1))
    const yesterday = new Date(new Date().setDate(new Date().getDate() - 1))

    if (!text) return { status: false, url: [] }

    const links = [...new Set(text.match(/https?:\/\/[^\s/$.?#].[^\s]*/gi) || [])].map((x) => {
      try {
        return decodeURIComponent(x)
      } catch (error) {
        return x
      }
    })

    const txt = links.length > 0 ? `${links.join("\n")}\n\n${text}` : text
    const sanitized = txt.replace(/[^a-zA-Z0-9?=&]/g, "")

    const whitelist = ["linkdanaid", "danaid", "kaget?c", "ambil?c"]
    const blacklist = ["linkdanaidqr", "linkdanaidminta", "qrdanaid", "wwwdanaid", "deals", "shopeecoidqr"]

    const parser = { status: whitelist.find((x) => sanitized.includes(x)) && !blacklist.find((x) => sanitized.includes(x)), url: [], dana: [], gopay: [], shopee: [], orderId: [] }

    const dateFormater = (date) => {
      const year = date.getFullYear()
      const month = String(date.getMonth() + 1).padStart(2, "0")
      const day = String(date.getDate()).padStart(2, "0")

      return `${year}${month}${day}`
    }

    const mathParser = (text) => {
      let tmp = text
      let math = text.match(/\(?\s*\d+\s*[÷×xX:/+\-*]\s*\d+(\s*[÷×xX:/+\-*]\s*\d+)*\s*\)?/g) || []

      math.forEach((word) => {
        try {
          const start = word.indexOf("(") < 0 ? 0 : word.indexOf("(") + 1
          const end = word.indexOf(")") < 0 ? word.length : word.indexOf(")")

          return (tmp = tmp.replace(word, eval(word.slice(start, end))))
        } catch (error) {}
      })

      return tmp
    }

    const binaryParser = (text) => {
      const words = (text.match(/\b\w+\b/g) || []).filter((x) => /^[0-1]+$/.test(x[0])).filter((x) => /^[0-1]+$/.test(x) && x.length > 3)
      return words.map((chunk) => String.fromCharCode(parseInt(chunk, 2))).join("") || ""
    }

    const hexParser = (text) => {
      const arr = text.split(" ").map((x) => {
        if (!/[^0-9a-fA-F]/.test(x) && x.length % 2 === 0) return Buffer.from(x, "hex").toString("utf8")
        return x
      })

      return arr.join(" ")
    }

    const base64Decoder = (text) => {
      try {
        const candidates = text.match(/([A-Za-z0-9+/=]{8,})/g) || []

        const data = candidates
          .map((str) => {
            try {
              const decoded = Buffer.from(str, "base64").toString("utf-8")

              return decoded && /[a-z0-9]{3,}/i.test(decoded) ? decoded.replace(/\s+/, "") : null
            } catch {
              return null
            }
          })
          .filter((x) => x)

        return data?.join(" ") || text
      } catch (error) {
        return text
      }
    }

    const morseDecoder = (text) => {
      try {
        const morse = {
          ".-": "A",
          "-...": "B",
          "-.-.": "C",
          "-..": "D",
          ".": "E",
          "..-.": "F",
          "--.": "G",
          "....": "H",
          "..": "I",
          ".---": "J",
          "-.-": "K",
          ".-..": "L",
          "--": "M",
          "-.": "N",
          "---": "O",
          ".--.": "P",
          "--.-": "Q",
          ".-.": "R",
          "...": "S",
          "-": "T",
          "..-": "U",
          "...-": "V",
          ".--": "W",
          "-..-": "X",
          "-.--": "Y",
          "--..": "Z",
          "-----": "0",
          ".----": "1",
          "..---": "2",
          "...--": "3",
          "....-": "4",
          ".....": "5",
          "-....": "6",
          "--...": "7",
          "---..": "8",
          "----.": "9",
          ".-.-.-": ".",
          "--..--": ",",
          "..--..": "?",
          ".----.": "'",
          "-.-.--": "!",
          "-..-.": "/",
          "-.--.": "(",
          "-.--.-": ")",
          ".-...": "&",
          "---...": ":",
          "-.-.-.": ";",
          "-...-": "=",
          ".-.-.": "+",
          "-....-": "-",
          "..--.-": "_",
          ".-..-.": '"',
          "...-..-": "$",
          ".--.-.": "@",
          "/": " ",
        }

        return text
          .trim()
          .replace(/\s+/g, " ")
          .trim()
          .split(" ")
          .map((x) => morse[x] || "\n" + x)
          .join("")
          .toLowerCase()
      } catch (error) {
        return text
      }
    }

    const orderID = (text) => {
      const dates = [dateFormater(yesterday), dateFormater(today), dateFormater(tomorrow)]

      const a = text.match(/(?<=orderId=)[0-9]+/g) || []
      const b = text.match(new RegExp(`(?:${dates.join("|")})\\d{33}`, "g")) || []

      return [...new Set([...a, ...b])]
        .filter((x) => {
          const a = x.slice(0, 8)
          const b = x.slice(8, 14)
          const c = x.slice(14, 18)
          const d = x.slice(18, 29)
          const e = x.slice(29)

          const date = dates.find((y) => a === y)

          return x.length === 41 && date && b === "101214" && d === "15010300166"
        })
        .map((x) => {
          let code = "sawadikap"
          let find = links.find((y) => y.includes(x))

          if (find) {
            const danacode = (find.match(/(?<=c=)[a-zA-Z0-9]+/g) || []).filter((x) => x.length === 9 && x[0] === "s") || []
            if (danacode && danacode[0]) code = danacode[0]
          }

          return { link: x, danacode: code }
        })
    }

    const gopayChecker = (text) => {
      const sanitized = text.replace(/[^a-zA-Z0-9?=&]/g, "")

      const a = text.match(/NF8p\/[a-zA-Z0-9]{8}/gi) || []
      const b = sanitized.match(/NF8p[a-zA-Z0-9]{8}/gi) || []

      return [...new Set([...a, ...b].map((x) => `https://app.gopay.co.id/NF8p/${x.replace("NF8p/", "").replace("NF8p", "")}`))]
    }

    const shopeeChecker = (text) => {
      const a = text.match(/\bhttps?:\/\/[^\s]*shopee[^\s]*/gi) || []
      const b = text.replace(/\s/g, "").match(/https?:\/\/[^\s]*app\.shopeepay\.co\.id\/u\/(.{21})/g) || []
      const c =
        text
          .replace(/\s+/g, "")
          .replace(/http/g, "\nhttp")
          .replace(/(app\.shopeepay\.co\.id\/u)(?!\/)/g, "$1/")
          .match(/https?:\/\/[^\s]*app\.shopeepay\.co\.id\/u\/(.{21})/g) || []

      const whitelist = ["s.shopee.co.id", "app.shopeepay.co.id", "app.u.shopeepay.co.id", "sppay.shopee.co.id", "pay.u.shopee.co.id"]
      const blacklist = ["qr", "t.me", "ImageOCR"]

      const urls =
        [...new Set([...a, ...b, ...c])]
          .filter((x) => whitelist.find((y) => x.includes(y)) && !blacklist.find((z) => x.includes(z)))
          .map((x) => (x.includes("https://") ? x : "https://" + x))
          .map((x) => (x.includes("app.shopeepay.co.id") ? (x.split("app.shopeepay.co.id")[1].length !== 24 ? false : x) : x))
          .filter((x) => x) || []

      return urls.filter((x) => !x.includes("app.shopeepay.co.id/u/") || x.split("app.shopeepay.co.id/u/")[1]?.length === 21)
    }

    const danaChecker = (arr) => {
      const blacklist = [
        "http",
        "medusa",
        "35vcsyuu",
        "search",
        "subafxpak",
        "s6mulfung",
        "sawer",
        "games",
        "sadasaja",
        "telegram",
        "player",
        "src",
        "true",
        "false",
        "style",
        "default",
        "return",
        "length",
      ]

      const dana =
        [...new Set(arr)]
          .map((x) => (x.length === 8 ? "s" + x.slice(0, 8) : x.slice(0, 9)))
          .filter((x) => x && x[0] === "s" && x.length === 9 && !/[^a-z0-9]/.test(x) && (x.match(/\d/g) || []).length < 6)
          .filter((x) => !x.includes("i") && !x.includes("o") && !x.includes("0") && !x.includes("1"))
          .filter((x) => !text.includes("@" + x) && !text.includes("@" + x.slice(1)))
          .filter((x) => !parser.gopay.find((y) => y.includes(x.slice(1).toLowerCase())))
          .filter((x) => !blacklist.find((y) => x.includes(y)))
          .filter((x) => {
            const find = links.find((y) => y.toLowerCase().includes(x) || y.toLowerCase().includes(x.slice(1)))
            return find && !/dana/i.test(new URL(find).host) ? false : true
          })
          .map((x) => "https://link.dana.id/kaget?c=" + x) || []

      return dana
    }

    const danaParser = (text) => {
      // a ===> ambil 9 ataupun 8 huruf setelah ?= ataupun c=
      // b ===> ambil 9 ataupun 8 huruf setelah &r
      // c ===> mengambil kata dengan perpaduan text dan angka, contoh hahaha12 ha23sss (hahaha tidak akan masuk karena tida ada angka)
      // d ===> mengambil kata yang dipisahkan spasi satu ataupun lebih, contoh s a w  a  d   i k a p, contoh yang tidak akan masuk (s a wad i kap karena terdapat huruf wad yang menyatu)

      return {
        a: text.match(/(?<=(?:c=|\?=))[0-9a-zA-Z]{8,9}/g) || [],
        b: text.match(/[a-zA-Z0-9]{8,9}(?=&r)/g) || [],
        c: (text.match(/\w*\d+\w*/g) || []).filter((x) => (x.length === 8 || x.length === 9) && !/[A-Z]/.test(x) && !text.includes(`@${x}`)),
        d: (text.match(/\b(?:\w\s+)*\w\b(?:\s*\d+)?/g) || []).map((x) => x.replace(/\s+/g, "")).filter((x) => x.length === 8 || x.length === 9),
      }
    }

    const base64 = base64Decoder(txt)
    const binary = binaryParser(txt)
    const morse = morseDecoder(txt)
    const math = mathParser(txt)
    const hex = hexParser(txt)

    const orderId = Array.from(new Map([...orderID(txt), ...orderID(sanitized), ...orderID(binary), ...orderID(math)].map((x) => [x.link, x])).values()).map((x) => ({ merchant: "orderId", ...x }))

    const alpha = danaParser(txt)
    const beta = danaParser(sanitized)
    const charlie = danaParser(math)
    const delta = danaParser(binary)
    const echo = danaParser(base64)
    const foxtrot = danaParser(morse)
    const gamma = danaParser(hex)

    const { a, b, c, d } = {
      a: [...new Set([...alpha.a, ...beta.a, ...charlie.a, ...delta.a, ...echo.a, ...foxtrot.a, ...gamma.a])],
      b: [...new Set([...alpha.b, ...beta.b, ...charlie.b, ...delta.b, ...echo.b, ...foxtrot.b, ...gamma.b])],
      c: [...new Set([...alpha.c, ...beta.c, ...charlie.c, ...delta.c, ...echo.c, ...foxtrot.c, ...gamma.c])],
      d: [...new Set([...alpha.d, ...beta.d, ...charlie.d, ...delta.d, ...echo.d, ...foxtrot.d, ...gamma.d])],
    }

    parser.orderId = orderId
    parser.gopay = gopayChecker(text)
    parser.dana = danaChecker(special ? [...a, ...b, ...c, ...d] : [...a, ...b])
    parser.shopee = shopeeChecker(text)

    parser.url = [
      ...parser.orderId,
      ...parser.dana.map((x) => ({ merchant: "dana", link: x })),
      ...parser.gopay.map((x) => ({ merchant: "gopay", link: x })),
      ...parser.shopee.map((x) => ({ merchant: "shopee", link: x })),
    ]

    const danaalpha = ["Image OCR", "DANA", "Alpha", "@danawallet", "Satu", "Dompet", "BukanDompetBiasa", "Total", "Bayar", "Metode", "Pembayaran", "Detail", "Kirim", "Uang"]

    const isDanaAlphaMSG = text
      .toLowerCase()
      .split(" ")
      .filter((x) => danaalpha.find((y) => y.toLowerCase() === x))

    const status = isDanaAlphaMSG.length > 4 ? false : parser.url.length > 0 ? true : parser.status ? true : false

    return { status, url: parser.url }
  } catch (error) {
    console.log({ error, msg: "error on test function" })
    return { status: false, url: [] }
  }
}

export default urlParser
