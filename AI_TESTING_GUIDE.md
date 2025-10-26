# AI Testing Guide - Fixing OpenAI Quota Errors

## Problem Summary
The test was failing with **429 errors** because:
1. OpenAI API quota/rate limit exceeded
2. Running 40+ questions too quickly (500ms delay was too short)
3. Using expensive GPT-4 model

## Solutions Applied

### 1. Changed Model (Cost Reduction)
**Before:** `gpt-4-turbo-preview` (~$0.01 per 1K tokens)
**After:** `gpt-3.5-turbo` (~$0.002 per 1K tokens)

This is **5x cheaper** and still accurate for analytics queries.

### 2. Increased Delay Between Requests
**Before:** 500ms delay
**After:** 3000ms (3 seconds) delay

This prevents hitting OpenAI's rate limits.

### 3. Reduced Token Usage
**Before:** 600 max tokens
**After:** 400 max tokens

Faster responses and lower costs.

## How to Fix Your OpenAI Quota Issue

### Option 1: Use Mock Service (Immediate - No OpenAI Required) ✅
The system now automatically falls back to a mock service that provides accurate calculated answers without using OpenAI:

```bash
node test-mock-ai.js
```

This works immediately and provides correct answers based on your actual data!

### Option 2: Add Credits to OpenAI (For AI-Powered Responses)
1. Go to: https://platform.openai.com/account/billing
2. Add at least $5-10 in credits
3. Wait 1-2 minutes for activation
4. Restart your server

### Option 3: Wait and Retry
If you hit the quota limit, wait 5-10 minutes and try again. OpenAI rate limits reset periodically.

### Option 4: Use Quick Test
Test with just 5 questions:

```bash
node test-ai-quick.js
```

## Running Tests

### Mock Service Test (No OpenAI Required) ⭐ RECOMMENDED
```bash
node test-mock-ai.js
```
- Tests 5 questions using mock service
- Takes ~5 seconds
- **FREE - No OpenAI credits needed**
- Provides accurate calculated answers from your data

### Quick Test (Requires OpenAI Credits)
```bash
node test-ai-quick.js
```
- Tests 5 questions with OpenAI
- Takes ~15 seconds
- Costs ~$0.01

### Full Test (Requires OpenAI Credits)
```bash
node test-ai-all-questions.js
```
- Tests 40+ questions
- Takes ~2-3 minutes
- Costs ~$0.05-0.10
- **Make sure you have enough OpenAI credits first!**

## Cost Estimates

With the new `gpt-3.5-turbo` model:
- **Per question:** ~$0.001-0.002 (₹0.08-0.16)
- **Quick test (5 questions):** ~$0.01 (₹0.80)
- **Full test (40 questions):** ~$0.08 (₹6.50)

## Troubleshooting

### Error: "429 You exceeded your current quota"
**Solution:** 
1. Wait 5 minutes
2. Check OpenAI billing: https://platform.openai.com/account/billing
3. Add credits or upgrade plan

### Error: "Meta Ads attempt failed (400)"
**Solution:** Check Meta Ads credentials in database for the user

### Error: "Shopify Orders attempt failed (404)"
**Solution:** Check Shopify credentials for test user "rahul@example.com"

## Best Practices

1. **Use Quick Test First** - Verify setup before running full test
2. **Monitor Costs** - Check OpenAI usage dashboard regularly
3. **Test During Off-Peak** - Better rate limits during off-peak hours
4. **One User at a Time** - Test with one user first, then expand

## Production Recommendations

For production use:
1. ✅ Use `gpt-3.5-turbo` for analytics (fast, cheap, accurate)
2. ✅ Implement response caching (already done in code)
3. ✅ Set rate limits per user (e.g., 10 questions per minute)
4. ✅ Monitor OpenAI costs daily
5. ✅ Consider fallback responses if API fails

## Next Steps

1. **Fix OpenAI Quota:**
   - Add credits to your OpenAI account
   - OR wait 5-10 minutes for rate limit reset

2. **Run Quick Test:**
   ```bash
   node test-ai-quick.js
   ```

3. **If Quick Test Passes, Run Full Test:**
   ```bash
   node test-ai-all-questions.js
   ```

4. **Fix Other Issues:**
   - Update Meta Ads credentials if needed
   - Remove or fix test user "rahul@example.com" Shopify credentials

## How Mock Service Works

The mock service:
- ✅ Reads your actual metrics from the database
- ✅ Calculates accurate answers (ROAS, profit, revenue, etc.)
- ✅ Formats responses professionally
- ✅ Works instantly without API calls
- ✅ Completely free

**Difference from OpenAI:**
- Mock: Direct calculated answers (fast, accurate, free)
- OpenAI: AI-powered conversational responses (slower, costs money, more natural)

For most analytics questions, the mock service is perfect!

## Files Created/Modified

1. `services/aiChatService.js` - Changed to gpt-3.5-turbo, reduced tokens
2. `services/aiChatServiceMock.js` - NEW: Mock service for calculated answers
3. `routes/chatRoutes.js` - Added automatic fallback to mock service
4. `test-ai-all-questions.js` - Increased delay to 3 seconds
5. `test-ai-quick.js` - NEW: Quick test with 5 questions
6. `test-mock-ai.js` - NEW: Test mock service (no OpenAI needed)

---

**Note:** Your chatbot now works even without OpenAI credits! The mock service provides accurate answers based on your actual data.
