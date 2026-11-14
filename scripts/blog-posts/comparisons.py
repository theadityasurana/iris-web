"""Iris vs other job-search tools. Original copy; competitor descriptions stay at
the level of what kind of product each is, with a pointer to check their site."""

IRIS_ROW = {
    "how": "Swipe right on a job in the app; Iris fills in and submits the application on the company's own careers page",
    "auto": "Iris auto-apply (Starter and up) applies to matching jobs overnight and sends a morning report",
    "track": "Every application has a live status and timeline in the app; recruiter replies land in your Iris inbox",
    "prep": "Fit score, ATS keyword score and likely interview questions per job; AI mock interviews on Pro and Ultra",
    "price": "Free: 10 applications every 30 days. Starter ₹499 / $19.99, Pro ₹999 / $39.99, Ultra ₹2,199 / $59.99 a month. Web Trial ₹199 / $9.99 for 30 applications every 14 days",
}

COMPETITORS = [
    # slug, name, one-line category, what it's best for, who might prefer it
    ("tsenta", "Tsenta", "an AI job-application agent that applies to roles on your behalf", "hands-off applying across many job boards", "people who want an agent to work through a long list of postings without reviewing each one"),
    ("aiapply", "AIApply", "an AI toolkit for resumes, cover letters and automated applications", "generating tailored documents", "people who mainly want AI-written cover letters and resume versions"),
    ("aihawk", "AIHawk", "an open-source bot that automates LinkedIn applications", "developers comfortable running scripts locally", "technical users who want to self-host and customise the automation"),
    ("applypass", "ApplyPass", "a done-for-you application service", "outsourcing the applying entirely", "people who would rather pay a service than apply themselves"),
    ("autoapplymax", "AutoApplyMax", "an automated job-application tool", "volume applying", "people focused purely on the number of applications sent"),
    ("careerflow", "Careerflow", "a career copilot with a job tracker and LinkedIn profile tools", "organising a search and polishing a LinkedIn profile", "people who apply manually and want help staying organised"),
    ("fastapply", "FastApply", "an automated job-application service", "speed of submission", "people who want quick bulk submissions"),
    ("huntr", "Huntr", "a job-search tracker with resume tools", "tracking applications on a kanban board", "people who apply by hand and want a clean tracker"),
    ("jobcopilot", "JobCopilot", "an AI auto-apply copilot", "automated applying from preset criteria", "people who want automation on a desktop workflow"),
    ("jobhire-ai", "Jobhire.ai", "an AI auto-apply service", "delegating applications to an AI service", "people comfortable handing the search over completely"),
    ("jobright", "Jobright", "an AI job-matching copilot", "discovering roles that match a resume", "people who want recommendations and will apply themselves"),
    ("jobscan", "Jobscan", "a resume scanner that compares your resume with a job description", "checking ATS keyword match before applying", "people tuning one resume for a specific posting"),
    ("jobsolv", "Jobsolv", "a job-matching platform with tailored resumes", "finding and tailoring for remote roles", "people looking mainly at remote jobs"),
    ("lazyapply", "LazyApply", "a browser extension for bulk applying on job boards", "mass applying through job boards", "people applying in volume on LinkedIn-style Easy Apply listings"),
    ("loopcv", "LoopCV", "an automated job-search and application platform", "running automated search loops", "people who want recurring automated searches by email"),
    ("massive", "Massive", "an automated job-application service", "applying at volume", "people who want high-volume automation"),
    ("scale-jobs", "Scale.jobs", "a service where human assistants apply on your behalf", "human-assisted applying", "people who prefer a person, not software, doing the applying"),
    ("simplify", "Simplify", "a browser extension that autofills applications and tracks them", "speeding up applications you submit yourself", "people who apply on desktop and want forms prefilled"),
    ("sonara", "Sonara", "an AI job-search and auto-apply product", "automated matching and applying", "people who want a fully automated search"),
    ("sorce-jobs", "Sorce", "a swipe-based job application app", "swipe-to-apply on mobile", "people who like the swipe format and want to compare options"),
    ("teal", "Teal", "a resume builder and job tracker", "building resumes and tracking a search", "people who want a strong resume editor and apply themselves"),
    ("wobo-ai", "Wobo AI", "an AI job-search assistant", "AI help across a job search", "people who want a general AI assistant for job hunting"),
    ("wonsulting", "Wonsulting", "career coaching with AI job-search tools", "coaching plus tools", "people who value coaching and mentorship alongside tools"),
]


def comparison(slug, name, kind, best, who):
    title = f"Iris vs {name}: which is better for applying to jobs in 2026?"
    return {
        "slug": f"iris-vs-{slug}",
        "title": title,
        "seo_title": f"Iris vs {name} (2026): Features and Pricing",
        "description": f"Iris vs {name} compared: how each one applies, tracking, interview prep and price, and which kind of job seeker each suits best.",
        "keywords": f"Iris vs {name}, {name} alternative, {name} review, AI job application app, auto apply jobs",
        "category": "Comparisons",
        "excerpt": f"{name} is {kind}. Iris is a swipe-to-apply app that submits real applications on company career pages. Here's how they differ.",
        "tldr": f"{name} is {kind}, best for {best}. Iris turns a right swipe into a submitted application on the company's own careers page, tracks every application, scores your fit and ATS match, and can apply for you overnight. Pick {name} if you are one of {who}; pick Iris if you want to choose each job yourself in seconds and have the application done for you.",
        "body": f"""Choosing a job-search tool comes down to one question: **how much of the applying do you want to do yourself?** {name} and Iris answer it differently.

## What is {name}?

{name} is {kind}. It is best known for {best}. Features and prices change often, so check {name}'s own site for the current details before deciding.

## What is Iris?

Iris is a mobile app for iOS and Android that works like "Tinder for jobs". You see one job at a time, matched to the roles, level and location in your profile. Swipe right and Iris fills in the real application on the company's own careers page (Greenhouse, Lever, Ashby and similar systems), using your resume and profile. Swipe left to skip, swipe up to save.

## Iris vs {name} at a glance

| | Iris | {name} |
|---|---|---|
| How you apply | {IRIS_ROW['how']} | Depends on the product: {best} |
| Applying while you sleep | {IRIS_ROW['auto']} | Check {name}'s current features |
| Tracking | {IRIS_ROW['track']} | Varies |
| Interview prep | {IRIS_ROW['prep']} | Varies |
| Price | {IRIS_ROW['price']} | See {name}'s pricing page |

## Where Iris is different

- **You still choose every job.** Mass-apply tools send applications you never looked at. Iris shows you the job first, so every application is one you wanted, and it takes a second to decide.
- **Applications go to the source.** Iris applies on the employer's own applicant tracking system, not through a job board's quick-apply form.
- **Near you first.** Jobs in your city come first, then the rest of your country, then remote and international roles, always within your roles and level.
- **It never leaves you with an empty feed.** If a search or filter is too narrow, Iris widens it step by step and tells you what it changed.
- **Prep comes with the application.** Each job gets a fit score, an ATS keyword check and likely interview questions with STAR-style answers.

## Who should choose {name}?

{name} suits {who}. If that describes you, it may be the better fit.

## Who should choose Iris?

Iris suits people who want to stay in control of where they apply but don't want to fill in another application form. It's especially useful on mobile, for early-career roles, and for anyone applying to many companies' careers pages at once.

## Frequently asked questions

### Is Iris a good {name} alternative?

Yes, if you want a mobile, swipe-based way to apply where every application is to a job you picked, submitted on the company's own careers page and tracked in one place.

### Is Iris free?

Iris is free to start with 10 applications every 30 days. Paid plans add monthly application credits (75, 200 or 500), Iris auto-apply, more resumes and, on Pro and Ultra, AI mock interviews.

### Can I use Iris and {name} together?

Yes. Many people use one tool to research or polish their resume and Iris to apply quickly from their phone.
""",
    }


POSTS = [comparison(*c) for c in COMPETITORS] + [{
    "slug": "iris-vs-competitors",
    "title": "Iris vs other AI job application tools: an honest comparison (2026)",
    "seo_title": "Best Iris Alternatives & Competitors Compared (2026)",
    "description": "How Iris compares with auto-apply bots, done-for-you services, resume scanners and job trackers, and how to choose the right kind of tool.",
    "keywords": "AI job application tools comparison, auto apply tools, Iris alternatives, job application app, Sorce alternative, Simplify alternative",
    "category": "Comparisons",
    "excerpt": "There are four kinds of job-search tools. Here's what each is good at and where Iris fits.",
    "tldr": "Job-search tools fall into four groups: mass auto-apply bots, done-for-you services, resume scanners and builders, and trackers. Iris sits in a fifth spot: you pick each job with a swipe, and Iris submits the real application on the company's careers page, tracks it, and preps you for the interview.",
    "body": """Most "best AI job tools" lists compare products that do completely different jobs. It's easier to choose once you know which kind of tool you need.

## The four kinds of job-search tools

| Kind of tool | Examples | Good for | Trade-off |
|---|---|---|---|
| Mass auto-apply bots | LazyApply, AIHawk, JobCopilot | Volume | You don't see most jobs you apply to |
| Done-for-you services | ApplyPass, Scale.jobs | Handing off the work | Cost, and less control |
| Resume scanners and builders | Jobscan, Teal | A stronger resume | You still apply by hand |
| Trackers and copilots | Huntr, Careerflow, Simplify | Staying organised | You still apply by hand |

## Where Iris fits

Iris is a **swipe-to-apply** app. You see one matched job at a time and decide in a second. Swipe right and Iris fills in and submits the application on the company's own careers page. Every application is tracked, recruiter replies land in your Iris inbox, and each job comes with a fit score, ATS keyword check and interview questions.

If you want even less effort, Iris auto-apply (Starter and up) applies to jobs that match your profile overnight and sends you a morning report.

## How to choose

1. **Want to control where you apply but skip the forms?** Iris.
2. **Want maximum volume and don't mind not seeing each job?** A mass auto-apply bot.
3. **Want a person to do it?** A done-for-you service.
4. **Applying by hand and need a better resume?** A resume scanner or builder.

## Frequently asked questions

### Which AI job application tool is best?

The one that matches how involved you want to be. For quick, deliberate applications from your phone, Iris; for pure volume, an auto-apply bot; for hands-off, a done-for-you service.

### Does mass applying work?

It raises the number of applications but often lowers quality. Applying to fewer, better-matched jobs with a tailored resume usually gets more replies per application.

### How much does Iris cost?

Free for 10 applications every 30 days. Starter is ₹499 / $19.99 a month, Pro ₹999 / $39.99 and Ultra ₹2,199 / $59.99, with cheaper quarterly billing. On the website you can also start with the Trial plan: ₹199 / $9.99 for 30 applications, renewing every 14 days.
""",
}]
