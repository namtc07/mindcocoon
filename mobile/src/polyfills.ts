/**
 * Installs WebCrypto (crypto.subtle, getRandomValues) and Buffer from
 * react-native-quick-crypto, so @mindcocoon/core runs unchanged. Imported first by index.ts.
 */
import { install } from "react-native-quick-crypto";

install();
