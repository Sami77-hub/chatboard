const ADMIN_EMAIL = 's14930931@gmail.com';

let secondUser = null;
let secondUserUsed = false; // Sirf ek baar access

const checkAccess = (email) => {
  // Admin hamesha allowed
  if (email === ADMIN_EMAIL) {
    return { allowed: true, isAdmin: true };
  }

  // Agar doosra user pehle aa chuka hai (same email ya alag)
  if (secondUserUsed) {
    return { allowed: false, reason: 'Access denied. Slot already use ho chuka hai.' };
  }

  // Agar koi teesra aane ki koshish kare
  if (secondUser && secondUser !== email) {
    return { allowed: false, reason: 'Chat full hai. Sirf 2 log allowed hain.' };
  }

  // Pehli baar doosra user aa raha hai
  secondUser = email;
  secondUserUsed = true; // Ab koi aur nahi aa sakta
  return { allowed: true, isAdmin: false };
};

const trackMessage = (email) => {
  if (email === ADMIN_EMAIL) return { canSend: true };

  // Doosra user sirf 2 messages bhej sakta hai
  if (!secondUser || secondUser !== email) return { canSend: false };

  return { canSend: true };
};

module.exports = { checkAccess, trackMessage };