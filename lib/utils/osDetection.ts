/**
 * OS Detection and Native UI Utilities
 * Detects user's operating system and provides native design metrics
 */

export type OperatingSystem = 'ios' | 'android' | 'macos' | 'windows' | 'linux' | 'tvos' | 'unknown';

export interface OSDesignMetrics {
  os: OperatingSystem;
  spacing: {
    unit: number; // Base spacing unit (8px for Material, 4px for iOS)
    small: number;
    medium: number;
    large: number;
    xlarge: number;
  };
  borderRadius: {
    small: number;
    medium: number;
    large: number;
    xlarge: number;
  };
  typography: {
    fontFamily: string;
    fontSize: {
      small: string;
      medium: string;
      large: string;
      xlarge: string;
    };
  };
  colors: {
    primary: string;
    secondary: string;
    background: string;
    surface: string;
    text: string;
  };
  shadows: {
    small: string;
    medium: string;
    large: string;
  };
}

/**
 * Detect the user's operating system
 */
export function detectOS(): OperatingSystem {
  if (typeof window === 'undefined') return 'unknown';

  const userAgent = window.navigator.userAgent.toLowerCase();
  const platform = window.navigator.platform.toLowerCase();

  // iOS detection (iPhone, iPad, iPod)
  if (/iphone|ipad|ipod/.test(userAgent) || (platform === 'macintel' && navigator.maxTouchPoints > 1)) {
    // Check for tvOS
    if (/tvos|apple tv/.test(userAgent)) {
      return 'tvos';
    }
    return 'ios';
  }

  // Android detection
  if (/android/.test(userAgent)) {
    return 'android';
  }

  // macOS detection
  if (/macintosh|mac os x/.test(userAgent) || platform.includes('mac')) {
    return 'macos';
  }

  // Windows detection
  if (/windows/.test(userAgent) || platform.includes('win')) {
    return 'windows';
  }

  // Linux detection
  if (/linux/.test(userAgent) || platform.includes('linux')) {
    return 'linux';
  }

  return 'unknown';
}

/**
 * Get design metrics for the detected OS
 */
export function getOSDesignMetrics(os?: OperatingSystem): OSDesignMetrics {
  const detectedOS = os || detectOS();

  switch (detectedOS) {
    case 'ios':
      return {
        os: 'ios',
        spacing: {
          unit: 4, // iOS uses 4px base unit
          small: 8,
          medium: 16,
          large: 24,
          xlarge: 32,
        },
        borderRadius: {
          small: 8,
          medium: 12,
          large: 16,
          xlarge: 20,
        },
        typography: {
          fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", system-ui, sans-serif',
          fontSize: {
            small: '13px',
            medium: '15px',
            large: '17px',
            xlarge: '20px',
          },
        },
        colors: {
          primary: '#007AFF',
          secondary: '#5856D6',
          background: '#F2F2F7',
          surface: '#FFFFFF',
          text: '#000000',
        },
        shadows: {
          small: '0 1px 3px rgba(0, 0, 0, 0.12)',
          medium: '0 4px 6px rgba(0, 0, 0, 0.1)',
          large: '0 10px 20px rgba(0, 0, 0, 0.15)',
        },
      };

    case 'android':
      return {
        os: 'android',
        spacing: {
          unit: 8, // Material Design uses 8px base unit
          small: 8,
          medium: 16,
          large: 24,
          xlarge: 32,
        },
        borderRadius: {
          small: 4,
          medium: 8,
          large: 12,
          xlarge: 16,
        },
        typography: {
          fontFamily: '"Roboto", "Noto Sans", system-ui, sans-serif',
          fontSize: {
            small: '12px',
            medium: '14px',
            large: '16px',
            xlarge: '20px',
          },
        },
        colors: {
          primary: '#6200EE',
          secondary: '#03DAC6',
          background: '#FAFAFA',
          surface: '#FFFFFF',
          text: '#212121',
        },
        shadows: {
          small: '0 1px 2px rgba(0, 0, 0, 0.3)',
          medium: '0 2px 4px rgba(0, 0, 0, 0.2)',
          large: '0 4px 8px rgba(0, 0, 0, 0.15)',
        },
      };

    case 'macos':
      return {
        os: 'macos',
        spacing: {
          unit: 4,
          small: 8,
          medium: 16,
          large: 24,
          xlarge: 32,
        },
        borderRadius: {
          small: 6,
          medium: 10,
          large: 14,
          xlarge: 18,
        },
        typography: {
          fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", system-ui, sans-serif',
          fontSize: {
            small: '13px',
            medium: '15px',
            large: '17px',
            xlarge: '20px',
          },
        },
        colors: {
          primary: '#007AFF',
          secondary: '#5856D6',
          background: '#F5F5F7',
          surface: '#FFFFFF',
          text: '#1D1D1F',
        },
        shadows: {
          small: '0 1px 3px rgba(0, 0, 0, 0.1)',
          medium: '0 4px 6px rgba(0, 0, 0, 0.08)',
          large: '0 10px 20px rgba(0, 0, 0, 0.12)',
        },
      };

    case 'windows':
      return {
        os: 'windows',
        spacing: {
          unit: 4,
          small: 8,
          medium: 16,
          large: 24,
          xlarge: 32,
        },
        borderRadius: {
          small: 4,
          medium: 8,
          large: 12,
          xlarge: 16,
        },
        typography: {
          fontFamily: '"Segoe UI", system-ui, sans-serif',
          fontSize: {
            small: '12px',
            medium: '14px',
            large: '16px',
            xlarge: '18px',
          },
        },
        colors: {
          primary: '#0078D4',
          secondary: '#106EBE',
          background: '#F3F3F3',
          surface: '#FFFFFF',
          text: '#323130',
        },
        shadows: {
          small: '0 1px 2px rgba(0, 0, 0, 0.1)',
          medium: '0 2px 4px rgba(0, 0, 0, 0.1)',
          large: '0 4px 8px rgba(0, 0, 0, 0.1)',
        },
      };

    default:
      // Default web design (Material Design inspired)
      return {
        os: 'unknown',
        spacing: {
          unit: 8,
          small: 8,
          medium: 16,
          large: 24,
          xlarge: 32,
        },
        borderRadius: {
          small: 4,
          medium: 8,
          large: 12,
          xlarge: 16,
        },
        typography: {
          fontFamily: 'system-ui, -apple-system, sans-serif',
          fontSize: {
            small: '14px',
            medium: '16px',
            large: '18px',
            xlarge: '20px',
          },
        },
        colors: {
          primary: '#3B82F6',
          secondary: '#8B5CF6',
          background: '#FFFFFF',
          surface: '#F9FAFB',
          text: '#111827',
        },
        shadows: {
          small: '0 1px 2px rgba(0, 0, 0, 0.05)',
          medium: '0 4px 6px rgba(0, 0, 0, 0.1)',
          large: '0 10px 15px rgba(0, 0, 0, 0.1)',
        },
      };
  }
}

/**
 * Get CSS variables for OS-specific design
 */
export function getOSCSSVariables(os?: OperatingSystem): string {
  const metrics = getOSDesignMetrics(os);
  
  return `
    --os-spacing-unit: ${metrics.spacing.unit}px;
    --os-spacing-small: ${metrics.spacing.small}px;
    --os-spacing-medium: ${metrics.spacing.medium}px;
    --os-spacing-large: ${metrics.spacing.large}px;
    --os-spacing-xlarge: ${metrics.spacing.xlarge}px;
    --os-radius-small: ${metrics.borderRadius.small}px;
    --os-radius-medium: ${metrics.borderRadius.medium}px;
    --os-radius-large: ${metrics.borderRadius.large}px;
    --os-radius-xlarge: ${metrics.borderRadius.xlarge}px;
    --os-font-family: ${metrics.typography.fontFamily};
    --os-font-size-small: ${metrics.typography.fontSize.small};
    --os-font-size-medium: ${metrics.typography.fontSize.medium};
    --os-font-size-large: ${metrics.typography.fontSize.large};
    --os-font-size-xlarge: ${metrics.typography.fontSize.xlarge};
    --os-color-primary: ${metrics.colors.primary};
    --os-color-secondary: ${metrics.colors.secondary};
    --os-color-background: ${metrics.colors.background};
    --os-color-surface: ${metrics.colors.surface};
    --os-color-text: ${metrics.colors.text};
    --os-shadow-small: ${metrics.shadows.small};
    --os-shadow-medium: ${metrics.shadows.medium};
    --os-shadow-large: ${metrics.shadows.large};
  `;
}

