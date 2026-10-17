// Must run before anything touches `crypto`: installs WebCrypto (crypto.subtle) and Buffer
// from react-native-quick-crypto so @mindcocoon/core runs unchanged on iOS and Android.
import { install } from "react-native-quick-crypto";

install();

import { registerRootComponent } from "expo";

import App from "./App";

registerRootComponent(App);
