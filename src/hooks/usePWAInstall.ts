import { useEffect, useState } from 'react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
}

export function usePWAInstall() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isAndroid, setIsAndroid] = useState(false);
  const [isTablet, setIsTablet] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [isDesktop, setIsDesktop] = useState(false);
  const [platformName, setPlatformName] = useState<string>('Web Browser');

  useEffect(() => {
    // Detect standalone mode (already installed)
    const isStandalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as unknown as { standalone?: boolean }).standalone === true;
    setIsInstalled(isStandalone);

    // Detect device type & OS
    const userAgent = window.navigator.userAgent.toLowerCase();
    const isIOSDevice = /iphone|ipad|ipod/.test(userAgent) ||
      (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1); // iPadOS 13+
    const isAndroidDevice = /android/.test(userAgent);
    const isIPadDevice = /ipad/.test(userAgent) ||
      (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);

    // Screen width / touch characteristics for tablet vs mobile phone
    const screenWidth = window.innerWidth;
    const hasTouch = navigator.maxTouchPoints > 0 || 'ontouchstart' in window;
    const isTabletDevice =
      isIPadDevice ||
      (isAndroidDevice && !/mobile/.test(userAgent)) ||
      (hasTouch && screenWidth >= 640 && screenWidth <= 1180);

    const isMobileDevice = !isTabletDevice && (isIOSDevice || isAndroidDevice || screenWidth < 640);
    const isDesktopDevice = !isMobileDevice && !isTabletDevice;

    setIsIOS(isIOSDevice);
    setIsAndroid(isAndroidDevice);
    setIsTablet(isTabletDevice);
    setIsMobile(isMobileDevice);
    setIsDesktop(isDesktopDevice);

    if (isIPadDevice) {
      setPlatformName('iPad');
    } else if (isTabletDevice) {
      setPlatformName('Android Tablet');
    } else if (isIOSDevice) {
      setPlatformName('iPhone (iOS)');
    } else if (isAndroidDevice) {
      setPlatformName('Android Phone');
    } else if (/macintosh|mac os x/.test(userAgent)) {
      setPlatformName('macOS Web');
    } else if (/windows/.test(userAgent)) {
      setPlatformName('Windows PC');
    } else {
      setPlatformName('Web App');
    }

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    const handleAppInstalled = () => {
      setIsInstalled(true);
      setDeferredPrompt(null);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const install = async () => {
    if (!deferredPrompt) return false;
    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setIsInstalled(true);
      setDeferredPrompt(null);
      return true;
    }
    return false;
  };

  return {
    isInstallable: !!deferredPrompt,
    isInstalled,
    isIOS,
    isAndroid,
    isTablet,
    isMobile,
    isDesktop,
    platformName,
    deferredPrompt,
    install,
  };
}
