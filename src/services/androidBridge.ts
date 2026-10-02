import { Contact, AppAction } from '../types';

export const DEFAULT_CONTACTS: Contact[] = [
  {
    id: 'c-mom',
    name: 'Mom',
    nicknames: ['mummy', 'mother', 'maa', 'ammi', 'aai', 'মা', 'আম্মু', 'মা কে'],
    phone: '+91 98765 43210',
    relationship: 'Mother',
  },
  {
    id: 'c-dad',
    name: 'Dad',
    nicknames: ['papa', 'father', 'pitaji', 'baba', 'abbu', 'বাবা', 'আব্বু', 'বাবা কে'],
    phone: '+91 98765 43211',
    relationship: 'Father',
  },
  {
    id: 'c-rahul',
    name: 'Rahul',
    nicknames: ['rahul sharma', 'rahul bhai', 'রাহুল', 'ভাই'],
    phone: '+91 98765 43212',
    relationship: 'Friend',
  },
  {
    id: 'c-office',
    name: 'Office Sync',
    nicknames: ['work', 'manager', 'desk', 'অফিস'],
    phone: '+91 98765 43213',
    relationship: 'Colleague',
  },
];

export const getSavedContacts = (): Contact[] => {
  try {
    const raw = localStorage.getItem('arushi_contacts');
    if (raw) return JSON.parse(raw);
  } catch (e) {
    // fallback
  }
  return DEFAULT_CONTACTS;
};

export const saveContacts = (contacts: Contact[]) => {
  localStorage.setItem('arushi_contacts', JSON.stringify(contacts));
};

export interface ExecutionResult {
  success: boolean;
  message: string;
  status: 'success' | 'failed' | 'needs_clarification';
  fallbackUrl?: string;
  details?: any;
}

// Native Bridge Interface checking
const getNativeBridge = (): any => {
  if (typeof window === 'undefined') return null;
  // Check if native Android WebView interface is injected
  if ((window as any).Android && typeof (window as any).Android === 'object') {
    return (window as any).Android;
  }
  // Check if custom AndroidBridge exists
  if (
    (window as any).AndroidBridge &&
    (window as any).AndroidBridge.__isNative
  ) {
    return (window as any).AndroidBridge;
  }
  return null;
};

export const isNativeAndroidAvailable = (): boolean => {
  return getNativeBridge() !== null;
};

export const AndroidActionBridge = {
  /**
   * Open WhatsApp via Native Bridge or deep-link fallback
   */
  openWhatsApp: (phone?: string, text?: string): ExecutionResult => {
    const native = getNativeBridge();
    if (native && typeof native.openWhatsApp === 'function') {
      try {
        native.openWhatsApp(phone || '', text || '');
        return {
          success: true,
          status: 'success',
          message: 'WhatsApp opened via Android Native Intent.',
        };
      } catch (err: any) {
        console.warn('Native openWhatsApp error:', err);
      }
    }

    // Web / mobile browser fallback
    try {
      let url = 'https://wa.me/';
      if (phone) {
        const cleanPhone = phone.replace(/[^0-9]/g, '');
        url += cleanPhone;
      }
      if (text) {
        url += `?text=${encodeURIComponent(text)}`;
      }

      // Try intent or deep link first
      const deepLink = `whatsapp://send${
        phone ? `?phone=${phone.replace(/[^0-9]/g, '')}` : ''
      }${text ? `&text=${encodeURIComponent(text)}` : ''}`;

      // Open in a new tab or trigger window.location
      const newWin = window.open(url, '_blank', 'noopener,noreferrer');
      if (!newWin || newWin.closed) {
        window.location.href = deepLink;
      }

      return {
        success: true,
        status: 'success',
        fallbackUrl: url,
        message: 'WhatsApp opened successfully via deep-link.',
      };
    } catch (e: any) {
      return {
        success: false,
        status: 'failed',
        message: 'Could not open WhatsApp on this browser.',
      };
    }
  },

  /**
   * Open App by name (YouTube, Instagram, Chrome, Settings, etc.)
   */
  openApp: (appName: string): ExecutionResult => {
    const norm = (appName || '').trim().toLowerCase();
    const native = getNativeBridge();

    if (native && typeof native.openApp === 'function') {
      try {
        const res = native.openApp(norm);
        if (res !== false) {
          return {
            success: true,
            status: 'success',
            message: `Opened ${appName} via native Android Intent.`,
          };
        }
      } catch (err) {
        console.warn('Native openApp error:', err);
      }
    }

    // Web deep links map
    const appUrls: Record<string, { deepLink: string; webFallback: string }> = {
      whatsapp: {
        deepLink: 'whatsapp://',
        webFallback: 'https://web.whatsapp.com',
      },
      youtube: {
        deepLink: 'vnd.youtube://',
        webFallback: 'https://www.youtube.com',
      },
      instagram: {
        deepLink: 'instagram://',
        webFallback: 'https://www.instagram.com',
      },
      chrome: {
        deepLink: 'googlechrome://',
        webFallback: 'https://www.google.com',
      },
      browser: {
        deepLink: 'https://www.google.com',
        webFallback: 'https://www.google.com',
      },
      maps: {
        deepLink: 'geo:0,0',
        webFallback: 'https://maps.google.com',
      },
      camera: {
        deepLink: '',
        webFallback: '',
      },
      settings: {
        deepLink: '',
        webFallback: '',
      },
    };

    const target = appUrls[norm] || {
      deepLink: `${norm}://`,
      webFallback: `https://www.google.com/search?q=${encodeURIComponent(
        norm
      )}`,
    };

    if (norm === 'settings') {
      if (native && typeof native.openSettings === 'function') {
        native.openSettings();
        return {
          success: true,
          status: 'success',
          message: 'Device Settings opened.',
        };
      }
      return {
        success: false,
        status: 'failed',
        message:
          'Device Settings can only be opened directly when running inside an Android APK wrapper.',
      };
    }

    if (norm === 'camera') {
      if (native && typeof native.openCamera === 'function') {
        native.openCamera();
        return {
          success: true,
          status: 'success',
          message: 'Device Camera launched.',
        };
      }
    }

    if (target.webFallback) {
      window.open(target.webFallback, '_blank', 'noopener,noreferrer');
      return {
        success: true,
        status: 'success',
        fallbackUrl: target.webFallback,
        message: `Opened ${appName} in browser.`,
      };
    }

    return {
      success: false,
      status: 'failed',
      message: `Could not launch ${appName} on this platform.`,
    };
  },

  /**
   * Make Phone Call by direct phone number
   */
  makeCall: (phoneNumber: string): ExecutionResult => {
    const cleanPhone = (phoneNumber || '').trim();
    if (!cleanPhone) {
      return {
        success: false,
        status: 'failed',
        message: 'No phone number provided for calling.',
      };
    }

    const native = getNativeBridge();
    if (native && typeof native.makeCall === 'function') {
      try {
        native.makeCall(cleanPhone);
        return {
          success: true,
          status: 'success',
          message: `Dialing ${cleanPhone} via Android Dialer.`,
        };
      } catch (e) {
        console.warn('Native makeCall error:', e);
      }
    }

    // Web fallback: tel: link
    try {
      const telUrl = `tel:${cleanPhone.replace(/\s+/g, '')}`;
      window.location.href = telUrl;
      return {
        success: true,
        status: 'success',
        fallbackUrl: telUrl,
        message: `Opened phone dialer with ${cleanPhone}.`,
      };
    } catch (e: any) {
      return {
        success: false,
        status: 'failed',
        message: 'Could not open phone dialer on this device.',
      };
    }
  },

  /**
   * Call Contact by name with disambiguation & exact lookup
   */
  callContact: (contactName: string): ExecutionResult => {
    const rawTarget = (contactName || '').trim().toLowerCase();
    if (!rawTarget) {
      return {
        success: false,
        status: 'failed',
        message: 'Please specify who you would like to call.',
      };
    }

    const native = getNativeBridge();
    if (native && typeof native.callContact === 'function') {
      try {
        const res = native.callContact(rawTarget);
        if (res) {
          return {
            success: true,
            status: 'success',
            message: `Initiated call to ${contactName} via Android contacts.`,
          };
        }
      } catch (e) {
        console.warn('Native callContact error:', e);
      }
    }

    // Web Contact lookup from user's address book
    const contacts = getSavedContacts();

    // 1. Search for exact name match or nickname match
    const matches = contacts.filter((c) => {
      const nameNorm = c.name.toLowerCase();
      if (nameNorm === rawTarget) return true;
      if (c.nicknames?.some((nick) => nick.toLowerCase() === rawTarget)) {
        return true;
      }
      if (nameNorm.includes(rawTarget) || rawTarget.includes(nameNorm)) {
        return true;
      }
      return false;
    });

    if (matches.length === 1) {
      const contact = matches[0];
      const res = AndroidActionBridge.makeCall(contact.phone);
      return {
        ...res,
        message: `Calling ${contact.name} (${contact.phone})...`,
        details: contact,
      };
    }

    if (matches.length > 1) {
      const namesList = matches.map((m) => `${m.name} (${m.phone})`).join(', ');
      return {
        success: false,
        status: 'needs_clarification',
        message: `I found ${matches.length} contacts matching "${contactName}": ${namesList}. Which one should I call?`,
        details: matches,
      };
    }

    return {
      success: false,
      status: 'failed',
      message: `I couldn't find a contact named "${contactName}" in your contacts. You can add them in the Contacts tab.`,
    };
  },

  /**
   * Open Jawad's official WhatsApp link upon user confirmation
   */
  openJawadWhatsApp: (customUrl?: string): ExecutionResult => {
    const targetUrl = customUrl || 'https://wa.link/mvgabh';
    const native = getNativeBridge();

    if (native && typeof native.openUrl === 'function') {
      try {
        native.openUrl(targetUrl);
        return {
          success: true,
          status: 'success',
          fallbackUrl: targetUrl,
          message: 'জাওয়াদের WhatsApp লিংক খোলা হয়েছে।',
        };
      } catch (err: any) {
        console.warn('Native openJawadWhatsApp error:', err);
      }
    }

    try {
      const newWin = window.open(targetUrl, '_blank', 'noopener,noreferrer');
      if (!newWin || newWin.closed) {
        window.location.href = targetUrl;
      }
      return {
        success: true,
        status: 'success',
        fallbackUrl: targetUrl,
        message: 'জাওয়াদের WhatsApp লিংক সফলভাবে খোলা হয়েছে।',
      };
    } catch (e: any) {
      return {
        success: false,
        status: 'failed',
        message: 'দুঃখিত, জাওয়াদের WhatsApp লিংকটি এই মুহূর্তে খোলা সম্ভব হয়নি।',
      };
    }
  },

  /**
   * Open URL safely
   */
  openUrl: (url: string): ExecutionResult => {
    const targetUrl = url.startsWith('http') ? url : `https://${url}`;
    const native = getNativeBridge();
    if (native && typeof native.openUrl === 'function') {
      try {
        native.openUrl(targetUrl);
        return {
          success: true,
          status: 'success',
          message: `Opened ${targetUrl} in Android browser.`,
        };
      } catch (e) {
        // fallback
      }
    }

    window.open(targetUrl, '_blank', 'noopener,noreferrer');
    return {
      success: true,
      status: 'success',
      fallbackUrl: targetUrl,
      message: `Opened ${targetUrl}.`,
    };
  },
};

// Expose AndroidBridge globally on window for WebView / APK interop
if (typeof window !== 'undefined') {
  (window as any).AndroidBridge = {
    ...AndroidActionBridge,
    __isWebBridge: true,
  };
}

/**
 * Battery & Charging State Interface
 */
export interface BatteryState {
  isCharging: boolean;
  level: number;
  isSupported: boolean;
}

/**
 * Subscribes to device battery charging state events.
 * Works seamlessly with browser Battery Status API and native Android bridge.
 * Returns an unsubscription callback to prevent memory leaks and duplicate listeners.
 */
export const subscribeChargingEvents = (
  onStateChange: (isCharging: boolean, level: number) => void
): (() => void) => {
  if (typeof window === 'undefined') return () => {};

  let isCleanedUp = false;
  let batteryObj: any = null;

  const handleChargingChange = () => {
    if (isCleanedUp || !batteryObj) return;
    onStateChange(batteryObj.charging, Math.round(batteryObj.level * 100));
  };

  // 1. Check Native Android Bridge
  const native = getNativeBridge();
  if (native && typeof native.registerChargingListener === 'function') {
    try {
      (window as any).__onAndroidChargingChange = (charging: boolean, level: number) => {
        if (!isCleanedUp) onStateChange(charging, level);
      };
      native.registerChargingListener('__onAndroidChargingChange');
      return () => {
        isCleanedUp = true;
        try {
          native.unregisterChargingListener?.('__onAndroidChargingChange');
        } catch (e) {}
      };
    } catch (e) {
      console.warn('Native battery listener error:', e);
    }
  }

  // 2. Browser Battery Status API
  if (typeof navigator !== 'undefined' && (navigator as any).getBattery) {
    (navigator as any)
      .getBattery()
      .then((battery: any) => {
        if (isCleanedUp) return;
        batteryObj = battery;
        battery.addEventListener('chargingchange', handleChargingChange);
        battery.addEventListener('levelchange', handleChargingChange);
      })
      .catch((err: any) => {
        // Battery status API might be restricted in some browsers
      });

    return () => {
      isCleanedUp = true;
      if (batteryObj) {
        try {
          batteryObj.removeEventListener('chargingchange', handleChargingChange);
          batteryObj.removeEventListener('levelchange', handleChargingChange);
        } catch (e) {}
      }
    };
  }

  return () => {
    isCleanedUp = true;
  };
};

/**
 * Get current battery status snapshot
 */
export const getBatterySnapshot = async (): Promise<BatteryState> => {
  if (typeof window === 'undefined') {
    return { isCharging: false, level: 100, isSupported: false };
  }

  const native = getNativeBridge();
  if (native && typeof native.getBatteryStatus === 'function') {
    try {
      const status = native.getBatteryStatus();
      return {
        isCharging: Boolean(status.isCharging),
        level: Number(status.level) || 100,
        isSupported: true,
      };
    } catch (e) {}
  }

  if (typeof navigator !== 'undefined' && (navigator as any).getBattery) {
    try {
      const b = await (navigator as any).getBattery();
      return {
        isCharging: Boolean(b.charging),
        level: Math.round(b.level * 100),
        isSupported: true,
      };
    } catch (e) {}
  }

  return { isCharging: false, level: 100, isSupported: false };
};
