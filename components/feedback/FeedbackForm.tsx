import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useUser } from '@supabase/auth-helpers-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { supabase } from '@/lib/supabase';
import { FeedbackData, FEEDBACK_CATEGORIES } from '@/types/feedback';

const feedbackFormSchema = z.object({
  rating: z.number().min(1).max(5),
  category: z.string().min(1, 'Please select a category'),
  message: z.string().min(10, 'Message must be at least 10 characters'),
  feedback_type: z.enum(['general', 'bug', 'feature', 'other']),
  email: z.string().email().optional(),
});

type FeedbackFormValues = z.infer<typeof feedbackFormSchema>;

interface FeedbackFormProps {
  onSuccess?: () => void;
  initialData?: FeedbackData;
}

export function FeedbackForm({ onSuccess, initialData }: FeedbackFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const user = useUser();

  const form = useForm<FeedbackFormValues>({
    resolver: zodResolver(feedbackFormSchema),
    defaultValues: {
      rating: initialData?.rating || 5,
      category: initialData?.category || '',
      message: initialData?.message || '',
      feedback_type: initialData?.feedback_type || 'general',
      email: initialData?.email || user?.email || '',
    },
  });

  const onSubmit = async (data: FeedbackFormValues) => {
    try {
      setIsSubmitting(true);

      const feedbackData: FeedbackData = {
        ...data,
        user_id: user?.id,
        user_email: user?.email,
        metadata: {
          browser: navigator.userAgent,
          device: navigator.platform,
          path: window.location.pathname,
        },
      };

      const { error } = initialData?.id
        ? await supabase
            .from('user_feedback')
            .update(feedbackData)
            .eq('id', initialData.id)
        : await supabase.from('user_feedback').insert([feedbackData]);

      if (error) throw error;

      toast.success(
        initialData ? 'Feedback updated successfully' : 'Thank you for your feedback!'
      );
      form.reset();
      onSuccess?.();
    } catch (error) {
      console.error('Error submitting feedback:', error);
      toast.error('Failed to submit feedback. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="rating"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Rating</FormLabel>
              <FormControl>
                <div className="flex gap-4">
                  {[1, 2, 3, 4, 5].map((rating) => (
                    <Button
                      key={rating}
                      type="button"
                      variant={field.value === rating ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => field.onChange(rating)}
                    >
                      {rating}
                    </Button>
                  ))}
                </div>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="category"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Category</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a category" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {FEEDBACK_CATEGORIES.map((category) => (
                    <SelectItem key={category} value={category.toLowerCase()}>
                      {category}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="feedback_type"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Feedback Type</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select feedback type" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="general">General</SelectItem>
                  <SelectItem value="bug">Bug Report</SelectItem>
                  <SelectItem value="feature">Feature Request</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="message"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Message</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Tell us what you think..."
                  className="min-h-[100px]"
                  {...field}
                />
              </FormControl>
              <FormDescription>
                Please provide detailed feedback to help us improve.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        {!user && (
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Email</FormLabel>
                <FormControl>
                  <Input
                    placeholder="your@email.com"
                    type="email"
                    {...field}
                  />
                </FormControl>
                <FormDescription>
                  Optional: Leave your email if you'd like us to follow up.
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        )}

        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Submitting...' : initialData ? 'Update Feedback' : 'Submit Feedback'}
        </Button>
      </form>
    </Form>
  );
} 