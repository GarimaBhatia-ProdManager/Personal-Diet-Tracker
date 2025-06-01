import { Metadata } from 'next';
import { FeedbackForm } from '@/components/feedback/FeedbackForm';
import { FeedbackList } from '@/components/feedback/FeedbackList';

export const metadata: Metadata = {
  title: 'Feedback - Personal Diet Tracker',
  description: 'Share your feedback and help us improve.',
};

export default function FeedbackPage() {
  return (
    <div className="container py-10 space-y-10">
      <div>
        <h1 className="text-3xl font-bold tracking-tight mb-4">
          Share Your Feedback
        </h1>
        <p className="text-muted-foreground">
          We value your feedback! Help us improve by sharing your thoughts,
          reporting bugs, or suggesting new features.
        </p>
      </div>

      <div className="grid gap-10 lg:grid-cols-2">
        <div>
          <FeedbackForm />
        </div>
        <div>
          <FeedbackList />
        </div>
      </div>
    </div>
  );
} 