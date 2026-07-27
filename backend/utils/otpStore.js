const otpCache = new Map();

export const storeOTP = (email, date,ttlMs) => {
  otpCache.set(email, {
    ...data,
    expiresAt: Date.now() + ttlMs,
  });
}

export const getOTP = (email) => {
  const entry = otpCache.get(email);
    if (!entry) {
        return null;
    }
    if (Date.now() > entry.expiresAt) {
        otpCache.delete(email);
        return null;
    }
    return entry;
}

export const deleteOTP = (email) => {
  otpCache.delete(email);
}

setInterval(() => {
  const now = Date.now();
    for (const [email, entry] of otpCache.entries()) {
        if (now > entry.expiresAt) {
            otpCache.delete(email);
        }   
    }
}, 60 * 1000);