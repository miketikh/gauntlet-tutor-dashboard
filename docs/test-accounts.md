# Test Accounts for Local Development

All seed users now have authentication configured and can sign in to the application.

## Password for ALL accounts: `password`

## Available Test Accounts by Role

### 🧑‍💼 Admin Account
- **Email:** admin@tutorplatform.com
- **Password:** password
- **Role:** Platform Administrator
- **Use this for:** Accessing admin dashboards and management features

### 👩‍🏫 Tutor Accounts (6 tutors with varying performance levels)

#### Star Performer
- **Email:** ameliamartinez@gmail.com
- **Password:** password
- **Name:** Amelia Martinez
- **Performance:** Excellent metrics across the board

#### Solid Performer
- **Email:** sarahlewis@yahoo.com
- **Password:** password
- **Name:** Sarah Lewis
- **Performance:** Consistently good ratings

#### Additional Tutors
- isabella.allen64@gmail.com (Isabella Allen)
- rachel.hernandez@email.com (Rachel Hernandez)
- awhite@yahoo.com (Alexander White)
- liamwilliams@outlook.com (Liam Williams)

### 👨‍🎓 Student Accounts (20 students)

#### Example Students
- **Email:** cperez@gmail.com
- **Password:** password
- **Name:** Charlotte Perez

- **Email:** sophia.king@email.com
- **Password:** password
- **Name:** Sophia King

#### Full Student List
- aclark@outlook.com (Amelia Clark)
- liam.robinson62@yahoo.com (Liam Robinson)
- jessicathomas@gmail.com (Jessica Thomas)
- noah.young@outlook.com (Noah Young)
- alexanderrobinson@email.com (Alexander Robinson)
- noah.miller@outlook.com (Noah Miller)
- ashleygarcia@email.com (Ashley Garcia)
- csmith@outlook.com (Charlotte Smith)
- noah.anderson21@yahoo.com (Noah Anderson)
- evelyn.ramirez88@email.com (Evelyn Ramirez)
- sarah.smith@gmail.com (Sarah Smith)
- sarah.jackson@email.com (Sarah Jackson)
- christopher.white71@email.com (Christopher White)
- alexander.moore27@yahoo.com (Alexander Moore)
- harper.jackson@yahoo.com (Harper Jackson)
- william.lewis77@outlook.com (William Lewis)
- cthompson@email.com (Christopher Thompson)
- kevinanderson@outlook.com (Kevin Anderson)

## Quick Start

1. Make sure Supabase is running:
   ```bash
   npm run db:start
   ```

2. Start the application:
   ```bash
   npm run dev
   ```

3. Navigate to http://localhost:3000/auth/sign-in

4. Sign in with any of the accounts above using password: `password`

## Notes

- All accounts are automatically confirmed (no email verification needed)
- These accounts are linked to the seed data with sessions, metrics, and relationships
- The admin account has access to all platform features
- Tutor accounts will show their performance metrics and sessions
- Student accounts will show their learning history

## Recreating Auth Records

If you reset your database and need to recreate auth records for existing seed users, you can create a script using the Supabase Admin API:

```typescript
const { data, error } = await supabase.auth.admin.createUser({
  email: user.email,
  password: 'password',
  email_confirm: true,
  user_metadata: {
    name: user.name,
    app_role: user.role
  }
});
```

This documentation is for local development only. Production authentication should use secure passwords and proper user management.