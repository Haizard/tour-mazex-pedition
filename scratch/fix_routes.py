import sys

path = r'c:\Users\SFG DESIGN\Desktop\tour-mazex-pedition\backend\routes\customInquiryRoutes.js'
with open(path, 'r', encoding='utf-8') as f:
    content = f.read()

referral_logic = """        const scoring = scoreInquiryLead(inquiryData);

        if (inquiryData.referralCode) {
            scoring.leadScore = Math.min(100, (scoring.leadScore || 0) + 15);
            scoring.leadScoreReasons = scoring.leadScoreReasons || [];
            scoring.leadScoreReasons.push(`Referred traveler (Code: ${inquiryData.referralCode})`);
            scoring.leadTemperature = 'hot';
        }"""

old_block = """        const scoring = scoreInquiryLead(inquiryData);"""

content = content.replace(old_block, referral_logic)

with open(path, 'w', encoding='utf-8') as f:
    f.write(content)

print("Successfully updated customInquiryRoutes.js")
