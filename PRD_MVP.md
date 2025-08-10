# Smart Invoice Approval Agent - 4 Hour MVP

## Product Overview

AI agent that **remembers vendor patterns** and **learns from approvals** to auto-approve routine invoices with business reasoning.

## Core Demo Value

**"Watch it learn"**: Same vendor gets smarter routing after 3-5 examples.

## MVP Scope (4 Hours)

### Hour 1: Setup

- Next.js 15 + Supabase project
- Simple file upload for invoices
- Basic invoice table

### Hour 2: AI Core

- GPT-5 Vision for invoice OCR
- Extract: vendor, amount, description
- Store in database

### Hour 3: Learning Engine

- Track vendor → approver patterns
- Simple confidence scoring
- Auto-approve if confidence >80%

### Hour 4: Demo Interface

- Upload invoices
- Show learning progress
- Display decision reasoning

## Tech Stack (Minimal)

```javascript
// Frontend
- Next.js 15 (create-next-app)
- Tailwind CSS (default config)
- Basic React forms

// Backend
- Supabase (free tier)
- PostgreSQL tables
- OpenAI GPT-5 API

// No extras: No auth, no Slack, no complex UI
```

## Database (3 Tables Only)

```sql
invoices (id, vendor, amount, file_url, status, created_at)
approvers (id, name, email)
patterns (vendor, approver_id, success_count, total_count)
```

## Core Features Only

1. **Upload Invoice** → GPT-5 extracts vendor/amount
2. **Manual First Approval** → Creates pattern
3. **Auto-Approve Repeat Vendors** → Shows learning
4. **Simple Dashboard** → Shows patterns learned

## Demo Script (5 minutes)

1. Upload DataDog invoice → Route to John manually
2. Upload another DataDog invoice → Auto-routes to John
3. Show confidence score increasing
4. Upload new vendor → Routes to admin (low confidence)

## Success Criteria

- Extract invoice data accurately
- Learn from 2-3 examples per vendor
- Auto-approve with >80% confidence
- Show clear learning progression

## What We're NOT Building

- ❌ Cross-system integrations
- ❌ Complex approval workflows
- ❌ Authentication system
- ❌ Mobile responsive design
- ❌ Error handling
- ❌ Production deployment

## Implementation Order

1. **Supabase project + tables**
2. **Next.js with file upload**
3. **GPT-5 Vision integration**
4. **Pattern tracking logic**
5. **Simple dashboard view**

**Goal**: Prove the learning concept works in 4 hours. Everything else is future work.

This strips it down to the absolute core: **"AI that learns vendor patterns"** - the simplest possible demonstration of persistent memory that current tools can't do. 🎯
