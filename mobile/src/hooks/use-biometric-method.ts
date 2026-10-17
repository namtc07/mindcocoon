import { useEffect, useState } from "react";
import { biometricMethod, type BiometricMethod } from "@/lib/biometric";

/** "face" | "fingerprint" when the device has enrolled biometrics, else null. */
export function useBiometricMethod(): BiometricMethod | null {
  const [method, setMethod] = useState<BiometricMethod | null>(null);
  useEffect(() => {
    let alive = true;
    void biometricMethod().then((m) => {
      if (alive) setMethod(m);
    });
    return () => {
      alive = false;
    };
  }, []);
  return method;
}
