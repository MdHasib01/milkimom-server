import mongoose from 'mongoose';

// Predefined default section content for known product landing pages
export const DEFAULT_CONTENTS = {
  milkimom: {
    productSlug: 'milkimom',
    productName: 'মিল্কিমম',
    productNameEn: 'Milkimom',
    logoType: 'image',
    logoImage: '/images/logo.webp',
    announcementText: '⚡ আজই অর্ডার করলে মিল্কিমম ১০০% গ্যারান্টি সহ ডেলিভারি এবং ফ্রি ডেলিভারি অফার প্রজোয্য!',
    heroBadge: '১০০% প্রাকৃতিক উপাদান ও পার্শ্বপ্রতিক্রিয়ামুক্ত',
    heroTitle: 'মা ও শিশু, উভয়ের সুস্বাস্থ্যের জন্য প্রয়োজনীয় পুষ্টি নিশ্চিত করতে আমরা নিয়ে এসেছি মিল্কিমম™!',
    heroTitleHighlight: 'মিল্কিমম™',
    heroSubtitle: 'শিশুকে নিয়মিত দুধ খাওয়াচ্ছেন কিন্তু প্রয়োজনীয় দুধ পাচ্ছেন না, শিশুর কান্না থামছে না কিংবা ডাক্তারের কাছে ছুটতে হচ্ছে? দুশ্চিন্তার অবসান ঘটিয়ে শিশুর পুষ্টি ও মায়ের সুস্বাস্থ্য নিশ্চিতে নিয়ে নিন',
    heroSubtitleHighlight: 'শিশুর কান্না থামছে না কিংবা ডাক্তারের কাছে ছুটতে হচ্ছে',
    heroCtaText: 'অর্ডার করতে নিচে ক্লিক করুন',
    heroImage: '/images/product-jar.webp',
    doctorTitle: 'ডাক্তারের পরামর্শ ও সুপারিশকৃত',
    doctorName: 'ডা. ফারহানা শারমিন',
    doctorDegree: 'এমবিবিএস, এফসিপিএস (গাইনি এন্ড অব্স)',
    doctorQuote: 'মায়ের বুকের দুধ নবজাতকের জন্য সর্বোত্তম পুষ্টি। মিল্কিমম সম্পূর্ণ প্রাকৃতিক উপাদানে তৈরি যা নিরাপদভাবে দুধ উৎপাদনে কার্যকর সাহায্য করে।',
    doctorImage: '/assets/doctor/doctor.png',
    orderHeadline: 'আজই অর্ডার করুন মিল্কিমম™',
    orderSubheadline: 'নিচে আপনার তথ্য দিয়ে অর্ডার সম্পন্ন করুন',
    guaranteeTitle: '১০০% স্যাটিসফ্যাকশন ও মানি-ব্যাক গ্যারান্টি',
    guaranteeText: 'পণ্য হাতে পেয়ে পুরোপুরি সন্তুষ্ট না হলে বা কোনো সমস্যা থাকলে আমাদের সাপোর্ট টিমের সাথে সাথে যোগাযোগ করুন।',
    footerText: 'মিল্কিমম™ - মা ও শিশুর সুস্থতায় প্রতিদিনের নির্ভরযোগ্য প্রাকৃতিক সমাধান।',
    footerPhone: '01517-102603',
    footerEmail: 'milkimominfo@gmail.com',
    footerAddress: '202-J, Road-6, Mohammadiya Housing society, Mohammadpur, Dhaka.',
    carouselItems: [
      {
        id: '1',
        title: 'মা ও শিশুর যত্নে একটুও ছাড় নয়!',
        description: 'বিশেষজ্ঞ ডাক্তারের পরামর্শ ও ১০০% সঠিক পুষ্টিতে আপনার শিশুর সুস্থ বিকাশ নিশ্চিত করুন।',
        tag: 'ডাক্তারের পরামর্শ',
        image: '/assets/carousel/doctor.webp',
        imageMobile: '/assets/carousel/doctor.webp',
        imageSide: 'left',
        sortOrder: 1,
      },
      {
        id: '2',
        title: 'মা ও শিশুর যত্নে একটুও ছাড় নয়!',
        description: '১০০% প্রাকৃতিক উপাদানে তৈরি যা পার্শ্বপ্রতিক্রিয়ামুক্ত ও সম্পূর্ণ নিরাপদ।',
        tag: 'প্রাকৃতিক উপাদান',
        image: '/assets/carousel/pic2.webp',
        imageMobile: '/assets/carousel/pic2.webp',
        imageSide: 'right',
        sortOrder: 2,
      },
      {
        id: '3',
        title: 'মা ও শিশুর যত্নে একটুও ছাড় নয়!',
        description: 'হাজারো মায়েদের ভরসা ও ভালোবাসায় মিল্কিমম এগিয়ে চলেছে প্রতিদিন।',
        tag: 'মায়েদের ভরসা',
        image: '/assets/carousel/pic3.webp',
        imageMobile: '/assets/carousel/pic3.webp',
        imageSide: 'left',
        sortOrder: 3,
      },
    ],
  },
  smoothflow: {
    productSlug: 'smoothflow',
    productName: 'স্মুথফ্লো',
    productNameEn: 'SmoothFlow',
    logoType: 'text',
    logoImage: '/images/logo.webp',
    announcementText: '⚡ স্মুথফ্লো বিশেষ অফার! লঞ্চ প্রাইস মাত্র ৳১,৯৯৯ (রেগুলার ৳৩,২৯০, সাশ্রয় ৳১,২৯১) ও সারাদেশে ফ্রি ডেলিভারি!',
    heroBadge: '১০০% সাইডইফেক্ট মুক্ত ও সেফ ফর্মুলা',
    heroTitle: 'বাচ্চাকে দুধ খাওয়াতে গেলেই বুকের ব্যথা? মাত্র ২৪ ঘন্টায় মুক্তি পান।',
    heroTitleHighlight: 'মাত্র ২৪ ঘন্টায় মুক্তি পান।',
    heroSubtitle: 'বুকের এক পাশে শক্ত চাকার মতো অনুভূতি, চাপ, tenderness, আর Feed করানোর সময় অস্বস্তি এগুলো সবই clogged-duct related',
    heroSubtitleHighlight: 'clogged-duct related',
    heroCtaText: 'স্মুথফ্লো অর্ডার করতে নিচে ক্লিক করুন',
    heroImage: '/images/product-jar.webp',
    doctorTitle: 'মেডিকেল ও পুষ্টিবিজ্ঞান বিশেষজ্ঞদের সুপারিশকৃত',
    doctorName: 'ডা. ফারহানা শারমিন',
    doctorDegree: 'এমবিবিএস, এফসিপিএস, গাইনি ও শিশু স্বাস্থ্য বিশেষজ্ঞ',
    doctorQuote: 'বুকের দুধ চলাচলের পথ বন্ধ হওয়া বা ক্লগড ডাক্ট মায়েরা প্রায়ই ফেস করেন। স্মুথফ্লো একটি নিরাপদ ও প্রাকৃতিক সমাধান যা প্রাকৃতিকভাবে ক্লগড ডাক্ট খুলে দিয়ে ব্যথা দূর করে।',
    doctorImage: '/assets/doctor/doctor.png',
    orderHeadline: 'আজই স্মুথফ্লো™ অর্ডার করুন',
    orderSubheadline: 'আপনার painful Feeding-এর অবসান ঘটাতে নিচে আপনার ডেলিভারি তথ্য দিন',
    guaranteeTitle: '১০০% স্যাটিসফ্যাকশন ও কার্যকর গ্যারান্টি',
    guaranteeText: 'স্মুথফ্লো ব্যবহারে আপনার সমস্যার উপশম না হলে আমাদের সাপোর্ট টীমকে জানান এবং প্রয়োজনীয় দিকনির্দেশনা গ্রহণ করুন।',
    footerText: 'স্মুথফ্লো™ - মা ও শিশুর দুধদানকালীন ব্যথামুক্ত স্বস্তির ভরসা।',
    footerPhone: '01517-102603',
    footerEmail: 'smoothflow@milkimom.com',
    footerAddress: '202-J, Road-6, Mohammadiya Housing society, Mohammadpur, Dhaka.',
    carouselItems: [
      {
        id: '1',
        title: 'মা ও শিশুর যত্নে একটুও ছাড় নয়!',
        description: 'বিশেষজ্ঞ ডাক্তারের পরামর্শ ও ১০০% সঠিক পুষ্টিতে আপনার শিশুর সুস্থ বিকাশ নিশ্চিত করুন।',
        tag: 'ডাক্তারের পরামর্শ',
        image: '/assets/carousel/doctor.webp',
        imageMobile: '/assets/carousel/doctor.webp',
        imageSide: 'left',
        sortOrder: 1,
      },
      {
        id: '2',
        title: 'মা ও শিশুর যত্নে একটুও ছাড় নয়!',
        description: '১০০% প্রাকৃতিক উপাদান সমৃদ্ধ যা মায়ের বুকের দুধ প্রবাহ স্বাভাবিক রাখতে সাহায্য করে।',
        tag: 'প্রাকৃতিক সুরক্ষা',
        image: '/assets/carousel/pic2.webp',
        imageMobile: '/assets/carousel/pic2.webp',
        imageSide: 'right',
        sortOrder: 2,
      },
      {
        id: '3',
        title: 'মা ও শিশুর যত্নে একটুও ছাড় নয়!',
        description: 'দুধদানকালীন অস্বস্তি ও চাপ দূর করে মায়ের হাসি ফিরিয়ে আনাই আমাদের লক্ষ্য।',
        tag: 'ব্যথামুক্ত স্বস্তি',
        image: '/assets/carousel/pic3.webp',
        imageMobile: '/assets/carousel/pic3.webp',
        imageSide: 'left',
        sortOrder: 3,
      },
    ],
    doctorItems: [
      {
        id: 'saddam',
        name: 'ডা. মোঃ সাদ্দাম',
        degree: 'এমবিবিএস, এফসিপিএস (গাইনি এন্ড অব্স)',
        title: 'মেডিকেল বোর্ড অনুমোদিত',
        subtitle: 'চিকিৎসকের তত্ত্বাবধানে তৈরি ফর্মুলা',
        description: 'স্মুথফ্লো তৈরি হয়েছে গভর্নমেন্ট রেজিস্টার্ড চিকিৎসকদের তত্ত্বাবধানে, প্রাচীন আয়ুর্বেদিক জ্ঞান ও আধুনিক বিজ্ঞানের গবেষণার সমন্বয়ে।',
        image: '/assets/doctors/saddam.webp',
        sortOrder: 1,
      },
      {
        id: 'nazmul',
        name: 'ডা. মোঃ নাজমুল',
        degree: 'এমবিবিএস, ডিজিইউ, শিশু ও মাতৃ পুষ্টি বিশেষজ্ঞ',
        title: 'মেডিকেল বোর্ড অনুমোদিত',
        subtitle: 'চিকিৎসকের তত্ত্বাবধানে তৈরি ফর্মুলা',
        description: 'স্মুথফ্লো তৈরি হয়েছে গভর্নমেন্ট রেজিস্টার্ড চিকিৎসকদের তত্ত্বাবধানে, প্রাচীন আয়ুর্বেদিক জ্ঞান ও আধুনিক বিজ্ঞানের গবেষণার সমন্বয়ে।',
        image: '/assets/doctors/nazmul.webp',
        sortOrder: 2,
      },
    ],
  },
};

const landingPageContentSchema = new mongoose.Schema(
  {
    productSlug: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    productName: { type: String, default: '' },
    productNameEn: { type: String, default: '' },
    logoType: { type: String, enum: ['image', 'text'], default: 'image' },
    logoImage: { type: String, default: '/images/logo.webp' },
    announcementText: { type: String, default: '' },
    heroBadge: { type: String, default: '' },
    heroTitle: { type: String, default: '' },
    heroTitleHighlight: { type: String, default: '' },
    heroSubtitle: { type: String, default: '' },
    heroSubtitleHighlight: { type: String, default: '' },
    heroCtaText: { type: String, default: '' },
    heroImage: { type: String, default: '' },
    doctorTitle: { type: String, default: '' },
    doctorName: { type: String, default: '' },
    doctorDegree: { type: String, default: '' },
    doctorQuote: { type: String, default: '' },
    doctorImage: { type: String, default: '' },
    orderHeadline: { type: String, default: '' },
    orderSubheadline: { type: String, default: '' },
    guaranteeTitle: { type: String, default: '' },
    guaranteeText: { type: String, default: '' },
    footerText: { type: String, default: '' },
    footerPhone: { type: String, default: '' },
    footerEmail: { type: String, default: '' },
    footerAddress: { type: String, default: '' },
    carouselItems: { type: Array, default: [] },
    doctorItems: { type: Array, default: [] },
  },
  {
    timestamps: true,
  }
);

// Get section content by product slug, fallback to default content
landingPageContentSchema.statics.getContentBySlug = async function (slug = 'milkimom') {
  const normalizedSlug = String(slug).toLowerCase().trim();
  let content = await this.findOne({ productSlug: normalizedSlug });

  if (!content) {
    const defaultData = DEFAULT_CONTENTS[normalizedSlug] || {
      ...DEFAULT_CONTENTS.milkimom,
      productSlug: normalizedSlug,
    };

    content = await this.create({
      productSlug: normalizedSlug,
      ...defaultData,
    });
  }

  return content;
};

// Reset section content for a product slug back to default
landingPageContentSchema.statics.resetContentToDefault = async function (slug = 'milkimom') {
  const normalizedSlug = String(slug).toLowerCase().trim();
  const defaultData = DEFAULT_CONTENTS[normalizedSlug] || {
    ...DEFAULT_CONTENTS.milkimom,
    productSlug: normalizedSlug,
  };

  const content = await this.findOneAndUpdate(
    { productSlug: normalizedSlug },
    {
      $set: {
        productName: defaultData.productName,
        productNameEn: defaultData.productNameEn,
        logoType: defaultData.logoType,
        logoImage: defaultData.logoImage,
        announcementText: defaultData.announcementText,
        heroBadge: defaultData.heroBadge,
        heroTitle: defaultData.heroTitle,
        heroTitleHighlight: defaultData.heroTitleHighlight,
        heroSubtitle: defaultData.heroSubtitle,
        heroSubtitleHighlight: defaultData.heroSubtitleHighlight,
        heroCtaText: defaultData.heroCtaText,
        heroImage: defaultData.heroImage,
        doctorTitle: defaultData.doctorTitle,
        doctorName: defaultData.doctorName,
        doctorDegree: defaultData.doctorDegree,
        doctorQuote: defaultData.doctorQuote,
        doctorImage: defaultData.doctorImage,
        orderHeadline: defaultData.orderHeadline,
        orderSubheadline: defaultData.orderSubheadline,
        guaranteeTitle: defaultData.guaranteeTitle,
        guaranteeText: defaultData.guaranteeText,
        footerText: defaultData.footerText,
        footerPhone: defaultData.footerPhone,
        footerEmail: defaultData.footerEmail,
        footerAddress: defaultData.footerAddress,
        carouselItems: defaultData.carouselItems,
        doctorItems: defaultData.doctorItems,
      },
    },
    { new: true, upsert: true }
  );

  return content;
};

const LandingPageContent = mongoose.model('LandingPageContent', landingPageContentSchema);

export default LandingPageContent;
