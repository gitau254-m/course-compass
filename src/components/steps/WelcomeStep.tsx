import { useState } from 'react';
import { useApp } from '@/contexts/AppContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { GraduationCap, ArrowRight, UserCheck } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export function WelcomeStep() {
  const { setCurrentStep, setUser, setIsReturningUser, isReturningUser } = useApp();
  const [firstName, setFirstName] = useState('');
  const [gender, setGender] = useState('');
  const [age, setAge] = useState('');
  const [phone, setPhone] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showReturning, setShowReturning] = useState(false);
  const [returningPhone, setReturningPhone] = useState('');
  const [returningName, setReturningName] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!firstName.trim() || !gender || !age) {
      toast.error('Please fill in all required fields');
      return;
    }

    const ageNum = parseInt(age);
    if (ageNum < 14 || ageNum > 100) {
      toast.error('Please enter a valid age (14-100)');
      return;
    }

    setIsLoading(true);

    try {
      const { data, error } = await supabase
        .from('users')
        .insert({
          first_name: firstName.trim(),
          gender,
          age: ageNum,
          phone: phone.trim() || null,
        })
        .select()
        .single();

      if (error) throw error;

      setUser(data);
      toast.success(`Welcome, ${firstName}!`);
      setCurrentStep(2);
    } catch (error) {
      console.error('Error creating user:', error);
      toast.error('Failed to save your information. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleReturningUser = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!returningName.trim()) {
      toast.error('Please enter your first name');
      return;
    }

    setIsLoading(true);

    try {
      let query = supabase
        .from('users')
        .select('*')
        .ilike('first_name', returningName.trim());
      
      if (returningPhone.trim()) {
        query = query.eq('phone', returningPhone.trim());
      }

      const { data, error } = await query.order('created_at', { ascending: false }).limit(1);

      if (error) throw error;

      if (data && data.length > 0) {
        const user = data[0];
        setUser(user);
        setIsReturningUser(true);

        // Check if they have a confirmed payment
        const { data: paymentData } = await supabase
          .from('payments')
          .select('*')
          .eq('user_id', user.id)
          .eq('status', 'confirmed')
          .limit(1);

        if (paymentData && paymentData.length > 0) {
          toast.success(`Welcome back, ${user.first_name}! Retrieving your results...`);
          setCurrentStep(5);
        } else {
          toast.success(`Welcome back, ${user.first_name}!`);
          setCurrentStep(2);
        }
      } else {
        toast.error('No matching user found. Please start fresh.');
      }
    } catch (error) {
      console.error('Error finding user:', error);
      toast.error('Failed to find your information. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fade-in max-w-md mx-auto px-4">
      <div className="text-center mb-8">
        <div className="w-20 h-20 bg-gradient-primary rounded-full flex items-center justify-center mx-auto mb-4 shadow-elevated">
          <GraduationCap className="w-10 h-10 text-primary-foreground" />
        </div>
        <h1 className="text-2xl sm:text-3xl font-display font-bold text-foreground mb-2">
          KCSE Course Checker
        </h1>
        <p className="text-muted-foreground">
          Find the perfect university course based on your KCSE results
        </p>
      </div>

      {!showReturning ? (
        <form onSubmit={handleSubmit} className="space-y-5 glass-card rounded-2xl p-6">
          <div className="space-y-2">
            <Label htmlFor="firstName" className="text-sm font-medium">
              First Name <span className="text-accent">*</span>
            </Label>
            <Input
              id="firstName"
              placeholder="Enter your first name"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              className="h-12"
              required
            />
          </div>

          <div className="space-y-3">
            <Label className="text-sm font-medium">
              Gender <span className="text-accent">*</span>
            </Label>
            <RadioGroup value={gender} onValueChange={setGender} className="flex gap-4">
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="male" id="male" />
                <Label htmlFor="male" className="cursor-pointer">Male</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="female" id="female" />
                <Label htmlFor="female" className="cursor-pointer">Female</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="other" id="other" />
                <Label htmlFor="other" className="cursor-pointer">Other</Label>
              </div>
            </RadioGroup>
          </div>

          <div className="space-y-2">
            <Label htmlFor="age" className="text-sm font-medium">
              Age <span className="text-accent">*</span>
            </Label>
            <Input
              id="age"
              type="number"
              placeholder="Enter your age"
              value={age}
              onChange={(e) => setAge(e.target.value)}
              min={14}
              max={100}
              className="h-12"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone" className="text-sm font-medium">
              Phone Number <span className="text-muted-foreground text-xs">(optional)</span>
            </Label>
            <Input
              id="phone"
              type="tel"
              placeholder="e.g., 0712345678"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="h-12"
            />
          </div>

          <Button
            type="submit"
            className="w-full h-12 bg-gradient-primary hover:opacity-90 transition-opacity font-medium"
            disabled={isLoading}
          >
            {isLoading ? 'Please wait...' : 'Get Started'}
            <ArrowRight className="ml-2 w-4 h-4" />
          </Button>

          <div className="text-center pt-2">
            <button
              type="button"
              onClick={() => setShowReturning(true)}
              className="text-sm text-primary hover:underline flex items-center justify-center gap-1 mx-auto"
            >
              <UserCheck className="w-4 h-4" />
              Already used this before?
            </button>
          </div>
        </form>
      ) : (
        <form onSubmit={handleReturningUser} className="space-y-5 glass-card rounded-2xl p-6">
          <div className="text-center mb-4">
            <h2 className="text-lg font-semibold">Welcome Back!</h2>
            <p className="text-sm text-muted-foreground">Enter your details to retrieve your results</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="returningName" className="text-sm font-medium">
              First Name <span className="text-accent">*</span>
            </Label>
            <Input
              id="returningName"
              placeholder="Enter your first name"
              value={returningName}
              onChange={(e) => setReturningName(e.target.value)}
              className="h-12"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="returningPhone" className="text-sm font-medium">
              Phone Number <span className="text-muted-foreground text-xs">(optional)</span>
            </Label>
            <Input
              id="returningPhone"
              type="tel"
              placeholder="e.g., 0712345678"
              value={returningPhone}
              onChange={(e) => setReturningPhone(e.target.value)}
              className="h-12"
            />
          </div>

          <Button
            type="submit"
            className="w-full h-12 bg-gradient-primary hover:opacity-90 transition-opacity font-medium"
            disabled={isLoading}
          >
            {isLoading ? 'Searching...' : 'Find My Results'}
            <ArrowRight className="ml-2 w-4 h-4" />
          </Button>

          <div className="text-center pt-2">
            <button
              type="button"
              onClick={() => setShowReturning(false)}
              className="text-sm text-muted-foreground hover:text-foreground"
            >
              ← Start Fresh Instead
            </button>
          </div>
        </form>
      )}

      <p className="text-xs text-center text-muted-foreground mt-6 px-4">
        This tool provides guidance only and is not affiliated with KNEC or KUCCPS.
      </p>
    </div>
  );
}