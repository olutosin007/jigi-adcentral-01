# Sprint 02 — Authentication & Organisations

**Duration:** Week 2 (5 days)  
**Phase:** Foundation (2 of 3)  
**Goal:** Implement complete authentication flow and organisation management

---

## Sprint Objectives

1. Implement Supabase Auth with email/password
2. Create organisations and users tables with RLS
3. Build sign up, sign in, and password reset flows
4. Establish auth state management with Zustand
5. Add post-signup journey split: Brand-First vs Idea-First

---

## Deliverables

### Day 1: Database Schema (Auth Foundation)

- [ ] Create `organisations` table migration
- [ ] Create `users` table migration (extends auth.users)
- [ ] Set up auth trigger to create user record on signup
- [ ] Apply migrations to Supabase
- [ ] Test tables in Supabase dashboard

**Migration: organisations**
```sql
CREATE TABLE organisations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('brand', 'agency')),
    industry TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
```

**Migration: users**
```sql
CREATE TABLE users (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    organisation_id UUID REFERENCES organisations(id),
    email TEXT NOT NULL,
    name TEXT,
    role TEXT NOT NULL CHECK (role IN ('admin', 'approver', 'reviewer', 'creator')),
    journey_mode TEXT CHECK (journey_mode IN ('brand_first', 'idea_first')),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Trigger to create user record on auth signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.users (id, email, name, role)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'name', ''),
        'admin'
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION handle_new_user();
```

### Day 2: Row Level Security

- [ ] Enable RLS on organisations table
- [ ] Enable RLS on users table
- [ ] Create policies for viewing own organisation
- [ ] Create policies for viewing own user profile
- [ ] Test RLS policies with different user contexts

**RLS Policies:**
```sql
-- Organisations: Users can view their own org
ALTER TABLE organisations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own organisation"
ON organisations FOR SELECT
USING (id = (SELECT organisation_id FROM users WHERE id = auth.uid()));

CREATE POLICY "Users can update own organisation"
ON organisations FOR UPDATE
USING (id = (SELECT organisation_id FROM users WHERE id = auth.uid()));

-- Users: Users can view themselves and org members
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile"
ON users FOR SELECT
USING (id = auth.uid());

CREATE POLICY "Users can view org members"
ON users FOR SELECT
USING (
    organisation_id = (SELECT organisation_id FROM users WHERE id = auth.uid())
);

CREATE POLICY "Users can update own profile"
ON users FOR UPDATE
USING (id = auth.uid());
```

### Day 3: Auth State & Hooks

- [ ] Create `authStore.ts` with Zustand
- [ ] Implement `useAuth` hook
- [ ] Build `ProtectedRoute` component
- [ ] Handle auth state changes (login, logout)
- [ ] Implement session persistence

**Auth Store Structure:**
```typescript
interface AuthState {
  user: User | null
  session: Session | null
  isLoading: boolean
  error: string | null
  signUp: (email: string, password: string, name: string) => Promise<void>
  signIn: (email: string, password: string) => Promise<void>
  signOut: () => Promise<void>
  resetPassword: (email: string) => Promise<void>
}
```

### Day 4: Auth UI Pages

Build complete, polished authentication pages using the UI component library from Sprint 01.

- [ ] Build Login page with form validation
- [ ] Build Signup page with name, email, password
- [ ] Build Password Reset page
- [ ] Build Password Reset Confirmation page
- [ ] Add error handling and loading states
- [ ] Style pages with Jigi design system

**Pages to build:**
```
src/pages/auth/
├── Login.tsx
├── Signup.tsx
├── ResetPassword.tsx
└── ResetPasswordConfirm.tsx
```

**Login Page UI Specification:**
```
┌─────────────────────────────────────────────────────────────────┐
│                                                                 │
│                         [Jigi Logo]                             │
│                                                                 │
│                      Welcome back                               │
│                Sign in to your account                          │
│                                                                 │
│  ┌───────────────────────────────────────────────────────────┐ │
│  │ Email                                                     │ │
│  │ [                                                     ]   │ │
│  └───────────────────────────────────────────────────────────┘ │
│                                                                 │
│  ┌───────────────────────────────────────────────────────────┐ │
│  │ Password                                                  │ │
│  │ [                                                     ]   │ │
│  └───────────────────────────────────────────────────────────┘ │
│                                                                 │
│  [ ] Remember me                    Forgot password?            │
│                                                                 │
│              [ Sign In ]  (full width, primary button)          │
│                                                                 │
│  ────────────────────── or ──────────────────────               │
│                                                                 │
│              [ Continue with Google ]  (secondary)              │
│                                                                 │
│              Don't have an account? Sign up                     │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

**Signup Page UI Specification:**
```
┌─────────────────────────────────────────────────────────────────┐
│                                                                 │
│                         [Jigi Logo]                             │
│                                                                 │
│                    Create your account                          │
│               Start generating on-brand creative                │
│                                                                 │
│  Full name:     [                                           ]   │
│  Work email:    [                                           ]   │
│  Password:      [                                           ]   │
│                 (Must be at least 8 characters)                 │
│                                                                 │
│              [ Create Account ]  (full width, primary)          │
│                                                                 │
│              Already have an account? Sign in                   │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

**UI Requirements:**
- Clean, centered form layout (max-width 400px)
- Jigi logo at top
- Jigi brand colors (teal accent, warm background)
- Clear inline error messages below fields
- Loading spinner in button during submission
- Links between login/signup/reset pages
- Responsive on mobile

### Day 5: Organisation Setup Flow

- [ ] Build Organisation Creation page (post-signup)
- [ ] Implement organisation type selection (Brand/Agency)
- [ ] Link user to created organisation
- [ ] Add journey choice after org creation
- [ ] Redirect Brand-First users to onboarding
- [ ] Redirect Idea-First users to quick-start campaign creation
- [ ] Test complete signup → org creation flow

**Organisation Creation UI:**
```
┌─────────────────────────────────────────────────────────────────┐
│  Welcome to Jigi, {name}!                                       │
│                                                                 │
│  What type of organisation are you?                             │
│                                                                 │
│  ┌─────────────────────┐  ┌─────────────────────┐              │
│  │ 🎨 Brand            │  │ 🏢 Agency           │              │
│  │                     │  │                     │              │
│  │ I need to maintain  │  │ I create creative   │              │
│  │ brand guidelines    │  │ for brands          │              │
│  │ and approve work    │  │                     │              │
│  └─────────────────────┘  └─────────────────────┘              │
│                                                                 │
│  Organisation name: [                                       ]   │
│  Industry (optional): [ Select...                          ▼]   │
│                                                                 │
│              [ Continue to Setup ]                              │
└─────────────────────────────────────────────────────────────────┘
```

**Post-Org Journey Split UI:**
```
┌─────────────────────────────────────────────────────────────────┐
│  How do you want to start?                                      │
│                                                                 │
│  ┌──────────────────────────────┐  ┌──────────────────────────┐ │
│  │ Start with Brand Setup       │  │ Generate from Idea First │ │
│  │                              │  │                          │ │
│  │ Add logo, colours, voice     │  │ Start with a text brief  │ │
│  │ before generation             │  │ and retrofit brand later │ │
│  └──────────────────────────────┘  └──────────────────────────┘ │
│                                                                 │
│                 [ Continue ]                                    │
└─────────────────────────────────────────────────────────────────┘
```

---

## Technical Notes

### Supabase Auth Configuration

Enable email confirmation in Supabase dashboard:
- Auth → Settings → Email Auth
- Set custom email templates if desired
- Configure redirect URLs for password reset

### Auth Error Handling

Common errors to handle:
- Invalid email format
- Password too weak (< 6 chars)
- Email already registered
- Invalid credentials
- Network errors

### Session Management

```typescript
// Check for existing session on app load
useEffect(() => {
  supabase.auth.getSession().then(({ data: { session } }) => {
    setSession(session)
    setUser(session?.user ?? null)
  })

  const { data: { subscription } } = supabase.auth.onAuthStateChange(
    (_event, session) => {
      setSession(session)
      setUser(session?.user ?? null)
    }
  )

  return () => subscription.unsubscribe()
}, [])
```

---

## Acceptance Criteria

- [ ] Users can sign up with email and password
- [ ] Users can sign in and are redirected to dashboard
- [ ] Users can request password reset
- [ ] Session persists across browser refresh
- [ ] Protected routes redirect to login when unauthenticated
- [ ] Users can create an organisation after signup
- [ ] Organisation type is stored correctly
- [ ] Users can explicitly choose Brand-First or Idea-First journey
- [ ] Idea-First choice routes user to quick-start flow
- [ ] RLS policies prevent cross-org data access

---

## Test Scenarios

1. **New user signup:** Email → Password → Name → Org Type → Org Name → Dashboard
2. **Existing user login:** Email → Password → Dashboard
3. **Password reset:** Email → Reset link → New password → Login
4. **Session persistence:** Login → Close browser → Reopen → Still logged in
5. **RLS test:** User A cannot see User B's organisation
6. **Idea-First routing:** Signup → Org setup → Choose Idea-First → Lands on quick-start

---

## Dependencies for Next Sprint

Sprint 03 requires:
- Authentication working end-to-end
- Organisations table populated
- Users linked to organisations
- Protected route infrastructure
- Journey preference persisted on user/org setup

---

## Risks & Mitigations

| Risk | Mitigation |
|------|------------|
| Auth trigger not firing | Test manually, check Supabase logs |
| RLS too restrictive | Start permissive, tighten gradually |
| Session not persisting | Check localStorage, Supabase config |

---

## Template Benefits This Sprint

| Template | Benefit |
|----------|---------|
| **react-hook-form** | Login/signup forms with validation, minimal re-renders |
| **zod** | Email/password validation schemas |
| **shadcn Form** | Accessible form components with error states |
| **shadcn Input** | Password input with show/hide toggle |
| **Sonner** | Toast notifications for auth errors/success |

**Auth Forms with react-hook-form:**
```typescript
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'

const loginSchema = z.object({
  email: z.string().email('Please enter a valid email'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
})

type LoginData = z.infer<typeof loginSchema>

function LoginForm() {
  const form = useForm<LoginData>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  })
  
  const onSubmit = async (data: LoginData) => {
    const { error } = await supabase.auth.signInWithPassword(data)
    if (error) {
      toast.error(error.message)
    } else {
      router.navigate('/dashboard')
    }
  }
  
  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email</FormLabel>
              <FormControl>
                <Input type="email" placeholder="you@company.com" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        {/* Password field with similar pattern */}
        <Button type="submit" className="w-full" isLoading={form.formState.isSubmitting}>
          Sign In
        </Button>
      </form>
    </Form>
  )
}
```

---

*Sprint 02 of 10 — Foundation Phase*
