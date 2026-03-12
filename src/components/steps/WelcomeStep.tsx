import { useState, useEffect } from 'react';
import { useApp } from '@/contexts/AppContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { GraduationCap, ArrowRight, UserCheck, Loader2, ShieldCheck, Star } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { GRADE_POINTS } from '@/lib/clusterEngine';

type View = 'main' | 'new-user-form' | 'returning';

export function WelcomeStep() {
  const {
    setCurrentStep, setUser, setIsReturningUser,
    setPayment, setCompulsorySubjects, setOptionalSubjects,
    setInterestResponses,
  } = useApp();

  const [view, setView] = useState<View>('main');
  const [isLoading, setIsLoading] = useState(false);
  const [pendingUserId, setPendingUserId] = useState<string | null>(null);

  // New-user form fields
  const [firstName, setFirstName] = useState('');
  const [gender, setGender] = useState('');
  const [age, setAge] = useState('');
  const [phone, setPhone] = useState('');

  // Returning-user lookup fields
  const [retName, setRetName] = useState('');
  const [retPhone, setRetPhone] = useState('');

  // PWA install — detect platform for correct instructions
  const isIOS = /iphone|ipad|ipod/i.test(navigator.userAgent);
  const isAndroid = /android/i.test(navigator.userAgent);
  const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
  const [showInstallGuide, setShowInstallGuide] = useState(false);

  // Reviews state
  interface Review { id: string; reviewer_name: string; rating: number; message: string; }
  const [reviews, setReviews] = useState<Review[]>([]);
  useEffect(() => {
    supabase.from('reviews').select('id,reviewer_name,rating,message')
      .eq('approved', true).eq('rating', 5).limit(3)
      .then(({ data }) => { if (data) setReviews(data); });
  }, []);

  // ── Listen for Google OAuth redirect result ────────────────────────────────
  useEffect(() => {
    const { data: listener } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN' && session?.user) {
        await handlePostAuth(session.user as any);
      }
    });
    return () => listener.subscription.unsubscribe();
  }, []);

  // ── Load all saved data from DB for a returning user ─────────────────────
  const loadFullSession = async (userId: string) => {
    try {
      // Load their KCSE grades
      const { data: results } = await supabase
        .from('user_results')
        .select('*')
        .eq('user_id', userId);

      if (results && results.length > 0) {
        const compulsoryNames = ['mathematics', 'english', 'kiswahili'];
        const compulsory = results
          .filter(r => compulsoryNames.includes(r.subject.toLowerCase()))
          .map(r => ({ subject: r.subject, grade: r.grade, points: r.grade_points || GRADE_POINTS[r.grade] || 0 }));
        const optional = results
          .filter(r => !compulsoryNames.includes(r.subject.toLowerCase()))
          .map(r => ({ subject: r.subject, grade: r.grade, points: r.grade_points || GRADE_POINTS[r.grade] || 0 }));

        if (compulsory.length > 0) setCompulsorySubjects(compulsory);
        if (optional.length > 0) setOptionalSubjects(optional);
      }

      // Load their interest responses
      const { data: interests } = await supabase
        .from('interest_responses')
        .select('*')
        .eq('user_id', userId);

      if (interests && interests.length > 0) {
        const interestMap: Record<string, any> = {};
        interests.forEach((r: any) => {
          interestMap[r.question] = { answer: r.answer, score: r.score, fields: [] };
        });
        setInterestResponses(interestMap);
      }
    } catch (err) {
      console.error('loadFullSession error:', err);
      // Non-fatal: results page will recalculate if needed
    }
  };

  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: window.location.origin + '/app' },
    });
    if (error) {
      toast.error('Google sign-in failed. Use manual entry below.');
      setIsLoading(false);
    }
  };

  // ── After Google OAuth ─────────────────────────────────────────────────────
  const handlePostAuth = async (authUser: { id: string; email?: string; user_metadata?: any }) => {
    setIsLoading(true);
    try {
      // Brief wait for DB trigger
      await new Promise(r => setTimeout(r, 800));

      const { data: dbUser } = await supabase
        .from('users').select('*')
        .eq('auth_user_id', authUser.id)
        .maybeSingle();

      if (dbUser) {
        const isComplete = dbUser.gender && dbUser.gender !== 'other' && dbUser.age && dbUser.age !== 18;

        if (isComplete) {
          // ── FULLY RETURNING USER ───────────────────────────────────────
          setUser(dbUser as any);
          setIsReturningUser(true);

          const { data: payment } = await supabase
            .from('payments').select('*')
            .eq('user_id', dbUser.id).eq('status', 'confirmed')
            .order('created_at', { ascending: false }).limit(1).maybeSingle();

          if (payment) {
            // Load their saved grades + interests so results page works
            await loadFullSession(dbUser.id);
            setPayment(payment as any);
            toast.success(`Welcome back, ${dbUser.first_name}! Loading your results…`);
            setCurrentStep(6); // ← go straight to results
          } else {
            toast.success(`Welcome back, ${dbUser.first_name}! Continue your application.`);
            setCurrentStep(2);
          }
          return;
        }

        // Auto-created skeleton — need to complete profile
        const googleName = authUser.user_metadata?.given_name
          || (authUser.user_metadata?.full_name || '').split(' ')[0]
          || dbUser.first_name || '';
        setFirstName(googleName);
        setPendingUserId(dbUser.id);
        setView('new-user-form');
        toast.info('Almost done! Confirm your details.');
      } else {
        // Trigger didn't fire — show form
        const googleName = authUser.user_metadata?.given_name
          || (authUser.user_metadata?.full_name || '').split(' ')[0] || '';
        setFirstName(googleName);
        try {
          sessionStorage.setItem('pending_auth_id', authUser.id);
          sessionStorage.setItem('pending_email', authUser.email || '');
        } catch { /* ignore */ }
        setView('new-user-form');
      }
    } catch (err) {
      console.error('handlePostAuth error:', err);
      toast.error('Error loading your account. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // ── Save profile ───────────────────────────────────────────────────────────
  const handleNewUserSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!firstName.trim()) { toast.error('Please enter your first name'); return; }
    if (!gender) { toast.error('Please select your gender'); return; }
    if (!age) { toast.error('Please enter your age'); return; }
    const ageNum = parseInt(age);
    if (isNaN(ageNum) || ageNum < 14 || ageNum > 100) { toast.error('Valid age: 14–100'); return; }

    setIsLoading(true);
    try {
      let savedUser: any;

      if (pendingUserId) {
        // UPDATE the auto-created row
        const { data, error } = await supabase
          .from('users')
          .update({ first_name: firstName.trim(), gender, age: ageNum, phone: phone.trim() || null })
          .eq('id', pendingUserId)
          .select().single();
        if (error) throw error;
        savedUser = data;
      } else {
        // Fresh INSERT (manual, no Google)
        let pendingAuthId: string | null = null;
        let pendingEmail: string | null = null;
        try { pendingAuthId = sessionStorage.getItem('pending_auth_id'); pendingEmail = sessionStorage.getItem('pending_email'); } catch { /* ignore */ }

        const payload: any = { first_name: firstName.trim(), gender, age: ageNum, phone: phone.trim() || null };
        if (pendingAuthId) payload.auth_user_id = pendingAuthId;
        if (pendingEmail) payload.email = pendingEmail;

        const { data, error } = await supabase.from('users').insert(payload).select().single();
        if (error) throw error;
        savedUser = data;
        try { sessionStorage.removeItem('pending_auth_id'); sessionStorage.removeItem('pending_email'); } catch { /* ignore */ }
      }

      setUser(savedUser as any);
      toast.success(`Welcome, ${firstName.trim()}! Let's find your best courses.`);
      setCurrentStep(2);
    } catch (err: any) {
      console.error('Save user error:', err);
      toast.error(`Failed to save: ${err?.message || 'Please try again.'}`);
    } finally {
      setIsLoading(false);
    }
  };

  // ── Manual returning user lookup ───────────────────────────────────────────
  const handleReturningSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!retName.trim()) { toast.error('Please enter your first name'); return; }

    setIsLoading(true);
    try {
      // Check active Google session first
      const { data: sessionData } = await supabase.auth.getSession();
      if (sessionData?.session?.user) {
        await handlePostAuth(sessionData.session.user as any);
        return;
      }

      // Manual name + phone lookup
      let query = supabase.from('users').select('*').ilike('first_name', retName.trim());
      if (retPhone.trim()) query = query.eq('phone', retPhone.trim());

      const { data, error } = await query.order('created_at', { ascending: false }).limit(1);
      if (error) throw error;

      if (!data || data.length === 0) {
        toast.error('No account found. Try Google sign-in, or start fresh.');
        return;
      }

      const foundUser = data[0];
      setUser(foundUser as any);
      setIsReturningUser(true);

      const { data: payment } = await supabase
        .from('payments').select('*')
        .eq('user_id', foundUser.id).eq('status', 'confirmed')
        .order('created_at', { ascending: false }).limit(1).maybeSingle();

      if (payment) {
        // Load their saved session data
        await loadFullSession(foundUser.id);
        setPayment(payment as any);
        toast.success(`Welcome back, ${foundUser.first_name}! Loading your results…`);
        setCurrentStep(6); // ← straight to results
      } else {
        toast.success(`Welcome back, ${foundUser.first_name}! Continue your application.`);
        setCurrentStep(2);
      }
    } catch (err) {
      console.error(err);
      toast.error('Failed to find your account. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const GoogleIcon = () => (
    <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
    </svg>
  );

  const Header = () => (
    <div className="text-center mb-8">
      <div className="w-20 h-20 bg-gradient-primary rounded-full flex items-center justify-center mx-auto mb-4 shadow-elevated">
        <GraduationCap className="w-10 h-10 text-primary-foreground" />
      </div>
      <h1 className="text-2xl sm:text-3xl font-display font-bold text-foreground mb-2">
        KCSE Course Checker
      </h1>
      <p className="text-muted-foreground text-sm">
        Find the perfect university course based on your KCSE results
      </p>
    </div>
  );

  // ── MAIN LANDING ──────────────────────────────────────────────────────────
  if (view === 'main') return (
    <div className="fade-in max-w-md mx-auto px-4">
      <Header />
      <div className="glass-card rounded-2xl p-6 space-y-4">
        <p className="text-sm font-medium text-center">Get started</p>
        <Button onClick={handleGoogleSignIn} disabled={isLoading} variant="outline"
          className="w-full h-12 bg-white text-gray-700 border border-gray-300 hover:bg-gray-50">
          {isLoading ? <Loader2 className="w-5 h-5 mr-2 animate-spin" /> : <GoogleIcon />}
          Continue with Google
        </Button>
        <div className="flex items-center gap-3 text-xs text-muted-foreground">
          <div className="flex-1 h-px bg-border" /><span>or</span><div className="flex-1 h-px bg-border" />
        </div>
        <Button variant="outline" className="w-full h-12" onClick={() => setView('new-user-form')}>
          Start Without Sign-In
        </Button>
        <div className="pt-2 border-t border-border">
          <button onClick={() => setView('returning')}
            className="w-full text-sm text-primary hover:underline flex items-center justify-center gap-2 py-2">
            <UserCheck className="w-4 h-4" />
            Already used this before? Retrieve results
          </button>
        </div>
        {!isStandalone && (
          <div className="border-t border-border pt-3">
            <button onClick={() => setShowInstallGuide(p => !p)}
              className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-green-600 hover:bg-green-700 text-white text-sm font-semibold transition-colors">
              <GraduationCap className="w-4 h-4" />
              📲 Install App on Your Phone
            </button>
            {showInstallGuide && (
              <div className="mt-3 bg-green-50 border border-green-200 rounded-xl p-4 text-xs text-green-800 space-y-2">
                {isIOS ? (
                  <>
                    <p className="font-semibold">Install on iPhone / iPad:</p>
                    <p>1. Tap the <strong>Share</strong> button (box with arrow) at the bottom of Safari</p>
                    <p>2. Scroll down and tap <strong>"Add to Home Screen"</strong></p>
                    <p>3. Tap <strong>Add</strong> — done! ✅</p>
                  </>
                ) : isAndroid ? (
                  <>
                    <p className="font-semibold">Install on Android:</p>
                    <p>1. Tap the <strong>3-dot menu</strong> (⋮) at the top right of Chrome</p>
                    <p>2. Tap <strong>"Add to Home screen"</strong> or <strong>"Install app"</strong></p>
                    <p>3. Tap <strong>Install</strong> — done! ✅</p>
                  </>
                ) : (
                  <>
                    <p className="font-semibold">Install on Desktop Chrome:</p>
                    <p>1. Look for the <strong>install icon</strong> (⊕) in the address bar</p>
                    <p>2. Click it and select <strong>Install</strong> — done! ✅</p>
                  </>
                )}
              </div>
            )}
          </div>
        )}
      </div>
      <div className="flex items-center justify-center gap-2 mt-4 text-xs text-muted-foreground">
        <ShieldCheck className="w-4 h-4 text-green-600" />
        Google sign-in saves results — no re-payment next visit
      </div>
      <p className="text-xs text-center text-muted-foreground mt-3">
        Not affiliated with KNEC or KUCCPS. Guidance tool only.
      </p>

      {/* Reviews section */}
      {reviews.length > 0 && (
        <div className="mt-6">
          <p className="text-xs font-semibold text-center text-muted-foreground mb-3 uppercase tracking-wide">What Students Say</p>
          <div className="space-y-3">
            {reviews.map(r => (
              <div key={r.id} className="glass-card rounded-xl p-4">
                <div className="flex items-center gap-2 mb-1.5">
                  <span className="text-sm font-semibold">{r.reviewer_name}</span>
                  <div className="flex gap-0.5 ml-auto">
                    {[1, 2, 3, 4, 5].map(i => (
                      <Star key={i} className="w-3.5 h-3.5 fill-yellow-400 text-yellow-400" />
                    ))}
                  </div>
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">"{r.message}"</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );

  // ── NEW USER FORM ─────────────────────────────────────────────────────────
  if (view === 'new-user-form') return (
    <div className="fade-in max-w-md mx-auto px-4">
      <Header />
      <form onSubmit={handleNewUserSubmit} className="glass-card rounded-2xl p-6 space-y-5">
        <div className="text-center mb-2">
          <h2 className="text-lg font-semibold">Your Details</h2>
          <p className="text-sm text-muted-foreground">Takes under a minute</p>
        </div>
        <div className="space-y-2">
          <Label htmlFor="firstName">First Name <span className="text-destructive">*</span></Label>
          <Input id="firstName" placeholder="Enter your first name"
            value={firstName} onChange={e => setFirstName(e.target.value)} className="h-12" />
        </div>
        <div className="space-y-3">
          <Label>Gender <span className="text-destructive">*</span></Label>
          <RadioGroup value={gender} onValueChange={setGender} className="flex gap-4">
            {['male', 'female', 'other'].map(g => (
              <div key={g} className="flex items-center space-x-2">
                <RadioGroupItem value={g} id={`gender-${g}`} />
                <Label htmlFor={`gender-${g}`} className="cursor-pointer capitalize">{g}</Label>
              </div>
            ))}
          </RadioGroup>
        </div>
        <div className="space-y-2">
          <Label htmlFor="age">Age <span className="text-destructive">*</span></Label>
          <Input id="age" type="number" placeholder="Your age" min={14} max={100}
            value={age} onChange={e => setAge(e.target.value)} className="h-12" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="phone">Phone <span className="text-xs text-muted-foreground">(optional — for M-Pesa)</span></Label>
          <Input id="phone" type="tel" placeholder="e.g. 0712345678"
            value={phone} onChange={e => setPhone(e.target.value)} className="h-12" />
        </div>
        <Button type="submit" className="w-full h-12 bg-gradient-primary" disabled={isLoading}>
          {isLoading ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Saving…</> : <>Get Started <ArrowRight className="ml-2 w-4 h-4" /></>}
        </Button>
        <button type="button" onClick={() => { setView('main'); setPendingUserId(null); }}
          className="w-full text-sm text-muted-foreground hover:text-foreground text-center pt-1">
          ← Back
        </button>
      </form>
    </div>
  );

  // ── RETURNING USER ────────────────────────────────────────────────────────
  if (view === 'returning') return (
    <div className="fade-in max-w-md mx-auto px-4">
      <Header />
      <div className="glass-card rounded-2xl p-6 space-y-5">
        <div className="text-center mb-2">
          <h2 className="text-lg font-semibold">Welcome Back!</h2>
          <p className="text-sm text-muted-foreground">
            Sign in with the same Google account to get your saved results instantly.
          </p>
        </div>
        <Button onClick={handleGoogleSignIn} disabled={isLoading} variant="outline"
          className="w-full h-12 bg-white text-gray-700 border border-gray-300 hover:bg-gray-50">
          {isLoading ? <Loader2 className="w-5 h-5 mr-2 animate-spin" /> : <GoogleIcon />}
          Sign in with Google
        </Button>
        <div className="flex items-center gap-3 text-xs text-muted-foreground">
          <div className="flex-1 h-px bg-border" /><span>or find by name</span><div className="flex-1 h-px bg-border" />
        </div>
        <form onSubmit={handleReturningSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="retName">First Name <span className="text-destructive">*</span></Label>
            <Input id="retName" placeholder="Enter your first name"
              value={retName} onChange={e => setRetName(e.target.value)} className="h-12" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="retPhone">Phone <span className="text-xs text-muted-foreground">(helps find the right account)</span></Label>
            <Input id="retPhone" type="tel" placeholder="e.g. 0712345678"
              value={retPhone} onChange={e => setRetPhone(e.target.value)} className="h-12" />
          </div>
          <Button type="submit" variant="outline" className="w-full h-12" disabled={isLoading}>
            {isLoading ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Searching…</> : <>Find My Results <ArrowRight className="ml-2 w-4 h-4" /></>}
          </Button>
        </form>
        <button onClick={() => setView('main')}
          className="w-full text-sm text-muted-foreground hover:text-foreground text-center">
          ← Back to Home
        </button>
      </div>
    </div>
  );

  return null;
}
