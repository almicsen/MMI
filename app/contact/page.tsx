'use client';

import { useEffect, useMemo, useState } from 'react';
import { usePageEnabled } from '@/lib/hooks/usePageEnabled';
import LoadingState from '@/components/LoadingState';
import { useToast } from '@/contexts/ToastContext';
import { useAuth } from '@/contexts/AuthContext';
import ProtectedRoute from '@/components/ProtectedRoute';
import SectionHeading from '@/components/ui/SectionHeading';
import Card from '@/components/ui/Card';
import Input from '@/components/ui/Input';
import Textarea from '@/components/ui/Textarea';
import Select from '@/components/ui/Select';
import Button from '@/components/ui/Button';
import { detectDeviceType } from '@/lib/firebase/userActivity';

const templates = {
  generic: {
    label: 'General Inquiry',
    subject: 'General Inquiry',
    messagePrefix: '',
  },
  'report-issue': {
    label: 'Report an Issue',
    subject: 'Issue Report',
    messagePrefix: 'Issue Description:\n\n',
  },
  'api-inquiry': {
    label: 'API / Technical Inquiry',
    subject: 'API/Technical Inquiry',
    messagePrefix: 'Technical Details:\n\n',
  },
  business: {
    label: 'Business Inquiry',
    subject: 'Business Inquiry',
    messagePrefix: 'Business Details:\n\n',
  },
  feedback: {
    label: 'Feedback',
    subject: 'Feedback',
    messagePrefix: 'Feedback:\n\n',
  },
} as const;

type ContactTemplate = keyof typeof templates;

function ContactContent() {
  const { enabled, loading: pageCheckLoading } = usePageEnabled('contact');
  const toast = useToast();
  const { user } = useAuth();
  const [selectedTemplate, setSelectedTemplate] = useState<ContactTemplate>('generic');
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    if (user) {
      setFormData((prev) => ({
        ...prev,
        name: user.displayName || prev.name,
        email: user.email || prev.email,
      }));
    }
  }, [user]);

  const messageCount = useMemo(() => formData.message.length, [formData.message]);
  const messageLimit = 2000;

  const handleTemplateChange = (template: ContactTemplate) => {
    setSelectedTemplate(template);
    const templateConfig = templates[template];

    if (!formData.subject || Object.values(templates).some((t) => t.subject === formData.subject)) {
      setFormData((prev) => ({
        ...prev,
        subject: templateConfig.subject,
        message: templateConfig.messagePrefix,
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        message: prev.message.startsWith(templateConfig.messagePrefix)
          ? prev.message
          : templateConfig.messagePrefix + prev.message,
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (messageCount > messageLimit) {
      toast.showError('Message is too long.');
      return;
    }

    setSubmitting(true);

    try {
      const response = await fetch('/api/contact-messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          ...formData,
          metadata: {
            pageUrl: window.location.href,
            deviceType: detectDeviceType(),
          },
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to send message');
      }

      setSubmitted(true);
      setFormData({ name: '', email: '', subject: '', message: '' });
      setSelectedTemplate('generic');
      toast.showSuccess('Message sent successfully!');
    } catch (error) {
      console.error('Error submitting form:', error);
      toast.showError('Error submitting form. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (pageCheckLoading || !enabled) {
    return <LoadingState />;
  }

  if (submitted) {
    return (
      <div className="mx-auto max-w-3xl px-4 sm:px-6">
        <section className="section">
          <Card className="space-y-3">
            <p className="text-sm font-semibold text-[color:var(--brand-secondary)]">Message received</p>
            <h2 className="text-2xl font-semibold text-[color:var(--text-1)]">Thanks for reaching out.</h2>
            <p className="text-sm text-[color:var(--text-3)]">Our team will review your request and follow up.</p>
            <Button variant="outline" onClick={() => setSubmitted(false)}>
              Send another message
            </Button>
          </Card>
        </section>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl px-4 sm:px-6">
      <section className="section">
        <SectionHeading
          eyebrow="Contact"
          title="Start a direct conversation with the MMI team"
          subtitle="This channel is reserved for authenticated partners and collaborators."
        />
      </section>

      <section className="section-tight">
        <Card>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="template" className="text-sm font-medium text-[color:var(--text-2)]">
                Inquiry type
              </label>
              <Select
                id="template"
                value={selectedTemplate}
                onChange={(e) => handleTemplateChange(e.target.value as ContactTemplate)}
                className="mt-2"
              >
                {Object.entries(templates).map(([key, template]) => (
                  <option key={key} value={key}>
                    {template.label}
                  </option>
                ))}
              </Select>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="name" className="text-sm font-medium text-[color:var(--text-2)]">
                  Name
                </label>
                <Input
                  id="name"
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="mt-2"
                  placeholder="Your name"
                  autoComplete="name"
                />
              </div>
              <div>
                <label htmlFor="email" className="text-sm font-medium text-[color:var(--text-2)]">
                  Email
                </label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="mt-2"
                  placeholder="you@company.com"
                  autoComplete="email"
                />
              </div>
            </div>

            <div>
              <label htmlFor="subject" className="text-sm font-medium text-[color:var(--text-2)]">
                Subject
              </label>
              <Input
                id="subject"
                type="text"
                required
                value={formData.subject}
                onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                className="mt-2"
                placeholder="Brief subject line"
              />
            </div>

            <div>
              <label htmlFor="message" className="text-sm font-medium text-[color:var(--text-2)]">
                Message
              </label>
              <Textarea
                id="message"
                required
                rows={7}
                value={formData.message}
                onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                className="mt-2"
                placeholder="Share the context, timeline, and any helpful details."
                maxLength={messageLimit}
              />
              <div className="mt-2 flex items-center justify-between text-xs text-[color:var(--text-4)]">
                <span>We respond within 1-2 business days.</span>
                <span>{messageCount}/{messageLimit}</span>
              </div>
            </div>

            <Button type="submit" disabled={submitting}>
              {submitting ? 'Submitting...' : 'Send message'}
            </Button>
          </form>
        </Card>
      </section>
    </div>
  );
}

export default function Contact() {
  return (
    <ProtectedRoute>
      <ContactContent />
    </ProtectedRoute>
  );
}
