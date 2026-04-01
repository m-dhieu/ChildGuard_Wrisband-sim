// ChildGuard i18n - Arabic/English Internationalization
const i18n = {
    currentLang: localStorage.getItem('childguard-lang') || 'ar            'signal-offline': 'بدون اتصال (LoRaWAN)',
            
            // Time Format
            'datetime-format': 'ar-SA',
            'date-format': 'DD/MM/YYYY',
            'time-format': 'HH:mm:ss',
            
            // Network Status
            'network-online': 'متصل',
            'network-offline': 'غير متصل',
        },
        
        en: {
            // Header & Navigation
            'app-title': 'ChildGuard Wristband',
            'app-subtitle': 'Child Protection System',
            'lang-toggle': 'English',
            'dark-toggle': 'Dark',
            'user-greeting': 'Hello, Guardian',
            'logout': 'Logout',
            
            // Alert Banner
            'alert-ack': 'Acknowledge',
            
            // Device Selector
            'select-child': 'Select Child:',
            'child-1': 'Child 1 - Ahmed',
            'child-2': 'Child 2 - Mohammed',
            'child-3': 'Child 3 - Ali',
            
            // Dashboard Cards
            'map-title': 'Live Location & Safe Zone',
            'vitals-title': 'Heart Rate & Motion',
            'controls-title': 'Quick Controls',
            'alerts-title': 'Alerts',
            
            // Button Labels
            'panic-btn': 'Emergency Button (SOS)',
            'photo-btn': 'Manual Photos',
            'config-btn': 'Settings',
            
            // Status Messages
            'status-safe': '✓ Safe',
            'status-danger': '⚠ Danger',
            'no-alerts': 'No alerts. Child is safe ✓',
            
            // Alert Messages
            'alert-geofence': 'Alert: Child left safe zone',
            'alert-heart-rate': 'Alert: Heart rate elevated',
            'alert-motion': 'Alert: Violent motion detected',
            'alert-manual': 'Manual alert - Emergency button activated',
            'alert-escalation': 'Escalation: Response team notified',
            
            // Photo Evidence
            'photos-title': '📸 Automatic Evidence Photos',
            'photo-location': 'Location',
            'photo-time': 'Time',
            'photo-attacker': 'Attacker Photo',
            
            // Config Dialog
            'config-title': 'Guardian Settings',
            'config-emergency-contacts': 'Emergency Contacts',
            'config-add-contact': 'Add Contact',
            'config-geofence-radius': 'Safe Zone Radius (meters)',
            'config-save': 'Save',
            'config-cancel': 'Cancel',
            
            // Battery & Signal
            'battery-full': 'Battery Full',
            'battery-low': 'Battery Low',
            'signal-4g': '4G Available',
            'signal-3g': '3G Available',
            'signal-2g': '2G Available',
            'signal-offline': 'Offline (LoRaWAN)',
            
            // Time Format
            'datetime-format': 'en-US',
            'date-format': 'MM/DD/YYYY',
            'time-format': 'HH:mm:ss',
            
            // Network Status
            'network-online': 'Online',
            'network-offline': 'Offline',
        }translations: {
        ar: {
            // Header & Navigation
            'app-title': 'ChildGuard Wristband',
            'app-subtitle': 'نظام حماية الأطفال السودانية',
            'lang-toggle': 'عربي',
            'dark-toggle': 'ليلي',
            'user-greeting': 'مرحباً، حارس',
            'logout': 'تسجيل الخروج',
            
            // Alert Banner
            'alert-ack': 'تأكيد',
            
            // Device Selector
            'select-child': 'اختر الطفل:',
            'child-1': 'الطفل 1 - أحمد',
            'child-2': 'الطفل 2 - محمد',
            'child-3': 'الطفل 3 - علي',
            
            // Dashboard Cards
            'map-title': 'الموقع الحي والمنطقة الآمنة',
            'vitals-title': 'معدل القلب والحركة',
            'controls-title': 'التحكم السريع',
            'alerts-title': 'التنبيهات',
            
            // Button Labels
            'panic-btn': 'زر الطوارئ (SOS)',
            'photo-btn': 'صور يدوية',
            'config-btn': 'الإعدادات',
            
            // Status Messages
            'status-safe': '✓ آمن',
            'status-danger': '⚠ خطر',
            'no-alerts': 'لا توجد تنبيهات. الطفل آمن ✓',
            
            // Alert Messages
            'alert-geofence': 'تنبيه: خروج الطفل عن المنطقة الآمنة',
            'alert-heart-rate': 'تنبيه: ارتفاع معدل ضربات القلب',
            'alert-motion': 'تنبيه: حركة عنيفة كُتشِفت',
            'alert-manual': 'تنبيه يدوي - زر الطوارئ مُفعل',
            'alert-escalation': 'تصعيد: تم إخطار فريق الاستجابة',
            
            // Photo Evidence
            'photos-title': '📸 صور الدليل التلقائي',
            'photo-location': 'الموقع',
            'photo-time': 'الوقت',
            'photo-attacker': 'صورة المهاجم',
            
            // Config Dialog
            'config-title': 'إعدادات حارس الطفل',
            'config-emergency-contacts': 'جهات الاتصال الطارئة',
            'config-add-contact': 'إضافة جهة اتصال',
            'config-geofence-radius': 'نطاق المنطقة الآمنة (متر)',
            'config-save': 'حفظ',
            'config-cancel': 'إلغاء',
            
            // Battery & Signal
            'battery-full': 'بطارية ممتلئة',
            'battery-low': 'بطارية منخفضة',
            'signal-4g': '4G متاح',
            'signal-3g': '3G متاح',
            'signal-2g': '2G متاح',
            'signal-offline': 'بدون اتصال (LoRaWAN)',
            
            // Time Format
            'datetime-format': 'ar-SA',
            'date-format': 'DD/MM/YYYY',
            'time-format': 'HH:mm:ss',
        },
        
        en: {
            // Header & Navigation
            'app-title': 'ChildGuard Wristband',
            'app-subtitle': 'Child Protection System',
            'lang-toggle': 'English',
            'dark-toggle': 'Dark',
            'user-greeting': 'Hello, Guardian',
            'logout': 'Logout',
            
            // Alert Banner
            'alert-ack': 'Acknowledge',
            
            // Device Selector
            'select-child': 'Select Child:',
            'child-1': 'Child 1 - Ahmed',
            'child-2': 'Child 2 - Muhammad',
            'child-3': 'Child 3 - Ali',
            
            // Dashboard Cards
            'map-title': 'Live Location & Safe Zone',
            'vitals-title': 'Heart Rate & Motion',
            'controls-title': 'Quick Controls',
            'alerts-title': 'Alerts',
            
            // Button Labels
            'panic-btn': 'Emergency Button (SOS)',
            'photo-btn': 'Manual Photos',
            'config-btn': 'Settings',
            
            // Status Messages
            'status-safe': '✓ Safe',
            'status-danger': '⚠ Danger',
            'no-alerts': 'No alerts. Child is safe ✓',
            
            // Alert Messages
            'alert-geofence': 'Alert: Child left safe zone',
            'alert-heart-rate': 'Alert: Heart rate elevated',
            'alert-motion': 'Alert: Violent motion detected',
            'alert-manual': 'Manual alert - Emergency button activated',
            'alert-escalation': 'Escalation: Response team notified',
            
            // Photo Evidence
            'photos-title': '📸 Automatic Evidence Photos',
            'photo-location': 'Location',
            'photo-time': 'Time',
            'photo-attacker': 'Attacker Photo',
            
            // Config Dialog
            'config-title': 'Guardian Settings',
            'config-emergency-contacts': 'Emergency Contacts',
            'config-add-contact': 'Add Contact',
            'config-geofence-radius': 'Safe Zone Radius (meters)',
            'config-save': 'Save',
            'config-cancel': 'Cancel',
            
            // Battery & Signal
            'battery-full': 'Battery Full',
            'battery-low': 'Battery Low',
            'signal-4g': '4G Available',
            'signal-3g': '3G Available',
            'signal-2g': '2G Available',
            'signal-offline': 'Offline (LoRaWAN)',
            
            // Time Format
            'datetime-format': 'en-US',
            'date-format': 'MM/DD/YYYY',
            'time-format': 'HH:mm:ss',
            
            // Network Status
            'network-online': 'متصل',
            'network-offline': 'غير متصل',
        }
    },
    
    // Get translation
    t(key) {
        return this.translations[this.currentLang][key] || `[${key}]`;
    },
    
    // Set language
    setLang(lang) {
        if (lang === 'ar' || lang === 'en') {
            this.currentLang = lang;
            localStorage.setItem('childguard-lang', lang);
            document.documentElement.lang = lang;
            document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
            this.updateAllTranslations();
            return true;
        }
        return false;
    },
    
    // Get current language
    getLang() {
        return this.currentLang;
    },
    
    // Update all translations on page
    updateAllTranslations() {
        document.querySelectorAll('[data-i18n]').forEach(el => {
            const key = el.dataset.i18n;
            el.textContent = this.t(key);
        });
        
        document.querySelectorAll('[data-i18n-opt]').forEach(el => {
            const key = el.dataset.i18nOpt;
            el.textContent = this.t(key);
        });
    },
    
    // Initialize i18n
    init() {
        document.documentElement.lang = this.currentLang;
        document.documentElement.dir = this.currentLang === 'ar' ? 'rtl' : 'ltr';
        this.updateAllTranslations();
    }
};

// Initialize on load
document.addEventListener('DOMContentLoaded', () => {
    i18n.init();
});
