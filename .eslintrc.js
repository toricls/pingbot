module.exports = {
    "extends": ["eslint:recommended"],
    "plugins": [],
    "parserOptions": {},
    "env": {
        "browser": true,
        "es6": true,
        "node": true
    },
    "globals": {},
    "rules":{
        "indent": [
            "error",
            4
        ],
        "linebreak-style": [
            "error",
            "unix"
        ],
        "quotes": [
            "error",
            "single"
        ],
        "semi": [
            "error",
            "never"
        ],
        "no-console":0
    }
}
