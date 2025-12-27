import React, { Component, ErrorInfo, ReactNode } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { AlertTriangle, RefreshCw } from 'lucide-react-native';
import { tokens } from '@/ui/theme';

interface ErrorBoundaryProps {
  children: ReactNode;
  fallbackTitle?: string;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

/**
 * Error Boundary Component
 * Catches JavaScript errors in child components and displays fallback UI
 * Logs errors for debugging and troubleshooting
 */
export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    // Update state so the next render will show the fallback UI
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    // Log error details for debugging
    console.error('ErrorBoundary caught an error:', error);
    console.error('Error info:', errorInfo);

    // Store error details in state
    this.setState({
      error,
      errorInfo,
    });

    // Call optional error handler
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }

    // TODO: Send to error reporting service (Sentry, Bugsnag, etc.)
    // Example: Sentry.captureException(error, { extra: errorInfo });
  }

  handleReset = (): void => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
  };

  render(): ReactNode {
    if (this.state.hasError) {
      const { fallbackTitle = 'Something went wrong' } = this.props;
      const { error, errorInfo } = this.state;

      return (
        <View style={styles.container}>
          <View style={styles.content}>
            <AlertTriangle size={64} color={tokens.colors.danger} />

            <Text style={styles.title}>{fallbackTitle}</Text>

            <Text style={styles.message}>
              An unexpected error occurred. The error has been logged for investigation.
            </Text>

            <TouchableOpacity
              style={styles.retryButton}
              onPress={this.handleReset}
              activeOpacity={0.7}
            >
              <RefreshCw size={20} color={tokens.colors.text.inverse} />
              <Text style={styles.retryButtonText}>Try Again</Text>
            </TouchableOpacity>

            {__DEV__ && error && (
              <View style={styles.errorDetails}>
                <Text style={styles.errorDetailsTitle}>Error Details (Dev Only)</Text>
                <ScrollView style={styles.errorDetailsScroll}>
                  <Text style={styles.errorDetailsText}>
                    <Text style={styles.errorDetailsLabel}>Error: </Text>
                    {error.toString()}
                  </Text>
                  {error.stack && (
                    <Text style={styles.errorDetailsText}>
                      <Text style={styles.errorDetailsLabel}>Stack: </Text>
                      {error.stack}
                    </Text>
                  )}
                  {errorInfo && (
                    <Text style={styles.errorDetailsText}>
                      <Text style={styles.errorDetailsLabel}>Component Stack: </Text>
                      {errorInfo.componentStack}
                    </Text>
                  )}
                </ScrollView>
              </View>
            )}
          </View>
        </View>
      );
    }

    return this.props.children;
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: tokens.colors.background.primary,
    justifyContent: 'center',
    alignItems: 'center',
    padding: tokens.spacing[6],
  },
  content: {
    alignItems: 'center',
    maxWidth: 400,
  },
  title: {
    fontSize: tokens.typography.fontSize.xl,
    fontWeight: tokens.typography.fontWeight.bold,
    color: tokens.colors.text.primary,
    marginTop: tokens.spacing[4],
    textAlign: 'center',
  },
  message: {
    fontSize: tokens.typography.fontSize.base,
    color: tokens.colors.text.secondary,
    marginTop: tokens.spacing[3],
    textAlign: 'center',
    lineHeight: 22,
  },
  retryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: tokens.spacing[2],
    backgroundColor: tokens.colors.primary.main,
    paddingHorizontal: tokens.spacing[6],
    paddingVertical: tokens.spacing[3],
    borderRadius: tokens.radius.base,
    marginTop: tokens.spacing[6],
  },
  retryButtonText: {
    fontSize: tokens.typography.fontSize.base,
    fontWeight: tokens.typography.fontWeight.semibold,
    color: tokens.colors.text.inverse,
  },
  errorDetails: {
    marginTop: tokens.spacing[8],
    width: '100%',
    maxHeight: 300,
    backgroundColor: tokens.colors.surface.card,
    borderRadius: tokens.radius.md,
    borderWidth: 1,
    borderColor: tokens.colors.border.default,
    padding: tokens.spacing[4],
  },
  errorDetailsTitle: {
    fontSize: tokens.typography.fontSize.sm,
    fontWeight: tokens.typography.fontWeight.semibold,
    color: tokens.colors.danger,
    marginBottom: tokens.spacing[2],
  },
  errorDetailsScroll: {
    maxHeight: 240,
  },
  errorDetailsText: {
    fontSize: tokens.typography.fontSize.xs,
    color: tokens.colors.text.secondary,
    fontFamily: 'monospace',
    marginBottom: tokens.spacing[2],
  },
  errorDetailsLabel: {
    fontWeight: tokens.typography.fontWeight.bold,
    color: tokens.colors.text.primary,
  },
});
