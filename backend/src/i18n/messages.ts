export type SupportedLocale = "en" | "ar";

const exactTranslations: Record<string, string> = {
  Unauthorized: "غير مصرح",
  Forbidden: "ممنوع",
  "Missing Authorization header": "رأس Authorization مفقود",
  "Authorization header is invalid": "رأس Authorization غير صالح",
  "A valid email is required": "البريد الإلكتروني الصحيح مطلوب",
  "Password must be 8-72 characters and include letters and numbers":
    "كلمة المرور يجب أن تكون بين 8 و72 حرفاً وتحتوي على حروف وأرقام",
  "fullName must be at least 2 characters": "الاسم الكامل يجب أن يكون حرفين على الأقل",
  "Backend API is running": "واجهة برمجة التطبيقات تعمل",
  "Player not found": "اللاعب غير موجود",
  "Club not found": "النادي غير موجود",
  "Sport not found": "اللعبة غير موجودة",
  "Contract not found": "العقد غير موجود",
  "Favorite not found": "المفضلة غير موجودة",
  "Favorite already exists": "العنصر موجود بالفعل في المفضلة",
  "User profile not found": "ملف المستخدم غير موجود",
  "Invalid email or password": "البريد الإلكتروني أو كلمة المرور غير صحيحة",
  "Invalid or expired token": "الرمز غير صالح أو منتهي الصلاحية",
  "Failed to create account": "فشل إنشاء الحساب",
  "Failed to create user profile": "فشل إنشاء ملف المستخدم",
  "Failed to create club": "فشل إنشاء النادي",
  "Failed to create sport": "فشل إنشاء اللعبة",
  "Failed to create player": "فشل إنشاء اللاعب",
  "Failed to create contract": "فشل إنشاء العقد",
  "Failed to create document": "فشل إنشاء الوثيقة",
  "Failed to create achievement": "فشل إنشاء الإنجاز",
  "Failed to create favorite": "فشل إنشاء المفضلة",
  "Failed to update player": "فشل تحديث اللاعب",
  "Failed to update contract": "فشل تحديث العقد",
  "Failed to update achievement": "فشل تحديث الإنجاز",
  "Failed to close contract": "فشل إغلاق العقد",
  "Failed to change player status": "فشل تغيير حالة اللاعب",
  "Player already has an active contract": "اللاعب لديه عقد نشط بالفعل",
  "Only active contracts can be closed": "يمكن إغلاق العقود النشطة فقط",
  "Transfer did not return a result": "عملية الانتقال لم ترجع نتيجة",
  "Document not found for player": "الوثيقة غير موجودة لهذا اللاعب",
  "Achievement not found for player": "الإنجاز غير موجود لهذا اللاعب",
  "Route not found": "المسار غير موجود"
};

const patternTranslations: Array<{ regex: RegExp; replacer: (match: RegExpExecArray) => string }> = [
  {
    regex: /^Route not found: (.+)$/,
    replacer: (m) => `المسار غير موجود: ${m[1]}`
  },
  {
    regex: /^(.+) must be a valid UUID$/,
    replacer: (m) => `${m[1]} يجب أن يكون UUID صالحاً`
  },
  {
    regex: /^(.+) is required$/,
    replacer: (m) => `${m[1]} مطلوب`
  },
  {
    regex: /^(.+) must be between (\d+) and (\d+) characters$/,
    replacer: (m) => `${m[1]} يجب أن يكون بين ${m[2]} و ${m[3]} حرفاً`
  },
  {
    regex: /^(.+) must be at most (\d+) characters$/,
    replacer: (m) => `${m[1]} يجب ألا يتجاوز ${m[2]} حرفاً`
  },
  {
    regex: /^(.+) must be a string$/,
    replacer: (m) => `${m[1]} يجب أن يكون نصاً`
  },
  {
    regex: /^(.+) must be a date string$/,
    replacer: (m) => `${m[1]} يجب أن يكون تاريخاً نصياً`
  },
  {
    regex: /^(.+) must be in YYYY-MM-DD format$/,
    replacer: (m) => `${m[1]} يجب أن يكون بالصيغة YYYY-MM-DD`
  },
  {
    regex: /^(.+) must be a valid date$/,
    replacer: (m) => `${m[1]} يجب أن يكون تاريخاً صالحاً`
  },
  {
    regex: /^(.+) must be a number$/,
    replacer: (m) => `${m[1]} يجب أن يكون رقماً`
  },
  {
    regex: /^(.+) must be an integer between (\d+) and (\d+)$/,
    replacer: (m) => `${m[1]} يجب أن يكون رقماً صحيحاً بين ${m[2]} و ${m[3]}`
  }
];

export const resolveLocale = (acceptLanguage: string | undefined): SupportedLocale => {
  if (!acceptLanguage) {
    return "en";
  }
  return acceptLanguage.toLowerCase().startsWith("ar") ? "ar" : "en";
};

export const translateMessage = (message: string, locale: SupportedLocale): string => {
  if (locale === "en") {
    return message;
  }

  if (exactTranslations[message]) {
    return exactTranslations[message];
  }

  for (const entry of patternTranslations) {
    const match = entry.regex.exec(message);
    if (match) {
      return entry.replacer(match);
    }
  }

  return message;
};
