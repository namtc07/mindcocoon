// Order matters: ES imports are hoisted, so each side effect lives in its own module.
import "./src/polyfills";
import "./src/bootstrap";
import "expo-router/entry";
