// App Information Data
// This file contains all app version and build information

export const appInfo = {
  version: '1.0.0',
  buildNumber: '2024.01.08',
  appName: 'StockTrack',
  appDescription: 'Inventory Management System',
  releaseDate: 'January 8, 2024',
  
  // Feature List
  features: [
    {
      id: 1,
      name: 'انوینٹری مینجمنٹ',
      description: 'پروڈکٹس کو آسانی سے منظم کریں',
      icon: 'layers',
    },
    {
      id: 2,
      name: 'دیکھیں اور تبدیل کریں',
      description: 'اپنے انوینٹری کو حقیقی وقت میں دیکھیں',
      icon: 'eye',
    },
    {
      id: 3,
      name: 'رپورٹس',
      description: 'تفصیلی رپورٹس حاصل کریں',
      icon: 'bar-chart',
    },
    {
      id: 4,
      name: 'صارف مینجمنٹ',
      description: 'اپنی ٹیم کو منظم کریں',
      icon: 'people',
    },
  ],

  // Version History
  versionHistory: [
    {
      version: '1.0.0',
      date: 'January 8, 2024',
      changes: [
        'ابتدائی ریلیز',
        'انوینٹری مینجمنٹ خصوصیات',
        'صارف کی تصدیق',
        'بنیادی رپورٹنگ',
      ],
    },
  ],

  // Supported Platforms
  platforms: [
    {
      name: 'iOS',
      minVersion: '13.0',
      status: 'Supported',
    },
    {
      name: 'Android',
      minVersion: '8.0',
      status: 'Supported',
    },
  ],

  // Contact Information
  support: {
    email: 'support@stocktrack.com',
    phone: '+92-3XX-XXXXXXX',
    website: 'https://stocktrack.com',
  },

  // Legal
  legal: {
    privacy: 'Privacy Policy',
    terms: 'Terms & Conditions',
    copyright: 'StockTrack © 2024',
  },
};

export default appInfo;