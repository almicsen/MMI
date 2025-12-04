'use client';

import { useState } from 'react';
import { collection, addDoc, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { useToast } from '@/contexts/ToastContext';
import { usePageEnabled } from '@/lib/hooks/usePageEnabled';
import LoadingState from '@/components/LoadingState';

type ContactTemplate = 'generic' | 'report-issue' | 'api-inquiry' | 'business' | 'feedback';

interface TemplateConfig {
  label: string;
  subject: string;
  messagePrefix: string;
}

const templates: Record<ContactTemplate, TemplateConfig> = {
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
};

export default function Contact() {
  const { enabled, loading: pageCheckLoading } = usePageEnabled('contact');
  const toast = useToast();
  const [selectedTemplate, setSelectedTemplate] = useState<ContactTemplate>('generic');
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleTemplateChange = (template: ContactTemplate) => {
    setSelectedTemplate(template);
    const templateConfig = templates[template];
    
    // Update subject if it's empty or matches a previous template
    if (!formData.subject || Object.values(templates).some(t => t.subject === formData.subject)) {
      setFormData(prev => ({
        ...prev,
        subject: templateConfig.subject,
        message: templateConfig.messagePrefix,
      }));
    } else {
      // Keep existing message but update prefix if needed
      setFormData(prev => ({
        ...prev,
        message: prev.message.startsWith(templateConfig.messagePrefix) 
          ? prev.message 
          : templateConfig.messagePrefix + prev.message,
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      await addDoc(collection(db, 'contactSubmissions'), {
        ...formData,
        template: selectedTemplate,
        createdAt: Timestamp.now(),
        read: false,
      });
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

  // If page is disabled, the hook will redirect, so we don't need to render anything
  if (pageCheckLoading || !enabled) {
    return <LoadingState />;
  }

  if (submitted) {
    return (
      <div className="container mx-auto px-4 py-12 max-w-2xl">
        <div className="bg-green-100 dark:bg-green-900 border border-green-400 dark:border-green-700 text-green-700 dark:text-green-300 px-4 py-3 rounded">
          <p className="font-semibold">Thank you for your message!</p>
          <p>We'll get back to you as soon as possible.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-12 max-w-2xl">
      <h1 className="text-4xl font-bold mb-8 text-gray-900 dark:text-white">Contact Us</h1>
      
      {/* Template Selector */}
      <div className="mb-6">
        <label htmlFor="template" className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
          Select Inquiry Type
        </label>
        <select
          id="template"
          value={selectedTemplate}
          onChange={(e) => handleTemplateChange(e.target.value as ContactTemplate)}
          className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
        >
          {Object.entries(templates).map(([key, template]) => (
            <option key={key} value={key}>
              {template.label}
            </option>
          ))}
        </select>
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
          Choose a template to pre-fill the form with relevant fields
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label htmlFor="name" className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
            Name <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            id="name"
            required
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
            placeholder="Your full name"
          />
        </div>
        <div>
          <label htmlFor="email" className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
            Email <span className="text-red-500">*</span>
          </label>
          <input
            type="email"
            id="email"
            required
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
            placeholder="your.email@example.com"
          />
        </div>
        <div>
          <label htmlFor="subject" className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
            Subject <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            id="subject"
            required
            value={formData.subject}
            onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
            placeholder="Brief subject line"
          />
        </div>
        <div>
          <label htmlFor="message" className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
            Message <span className="text-red-500">*</span>
          </label>
          <textarea
            id="message"
            required
            rows={8}
            value={formData.message}
            onChange={(e) => setFormData({ ...formData, message: e.target.value })}
            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
            placeholder={selectedTemplate === 'report-issue' 
              ? 'Please describe the issue in detail, including steps to reproduce...'
              : selectedTemplate === 'api-inquiry'
              ? 'Please provide details about your API integration needs...'
              : 'Your message...'}
          />
          {selectedTemplate === 'report-issue' && (
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              💡 Tip: Include browser/device info, screenshots if possible, and steps to reproduce the issue
            </p>
          )}
          {selectedTemplate === 'api-inquiry' && (
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              💡 Tip: Include your use case, expected request volume, and any specific requirements
            </p>
          )}
        </div>
        <button
          type="submit"
          disabled={submitting}
          className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
        >
          {submitting ? 'Submitting...' : 'Send Message'}
        </button>
      </form>
    </div>
  );
}

