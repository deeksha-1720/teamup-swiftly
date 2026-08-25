# ProjectMatch Backend Foundation

Build the backend foundation for "ProjectMatch", a team formation platform.

TECH: React + TypeScript + Tailwind CSS, Supabase for database and auth.

AUTH:

Set up Supabase auth with simple email/password sign up and sign in. 

Disable email confirmation entirely — signup should log the user in 

immediately, with no email verification step required.

DATABASE:

Create a `profiles` table with:

- id, user_id (linked to auth.users), name, email

- user_type: "student" or "industry"

- college_name, branch, year_of_study (nullable, for students)

- current_role, years_of_experience, company (nullable, for industry)

- role_category: "Developer" / "Designer" / "Data/ML" / "Product" / "Other"

- skills (text array), interests (text array)

- availability (text: "Full-time" / "Part-time <10hrs/week" / "Weekends only")

- work_mode ("remote" or "in-person"), city (nullable, only used if in-person)

Enable Row Level Security:

- All signed-in users can VIEW all profiles

- Users can only INSERT/UPDATE/DELETE their own profile

Seed the table with 8-10 realistic fake profiles — a mix of student 

and industry, with varied skills, interests, availability, work modes, 

and cities (Bengaluru, Chennai, Mumbai etc), so there's data to test 

matching against later.

SCOPE FOR THIS PROMPT:

Only build the sign up

This project was built with [Lovable](https://lovable.dev).

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/72bed860-60b6-4c3f-b228-88c727f36b99).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
