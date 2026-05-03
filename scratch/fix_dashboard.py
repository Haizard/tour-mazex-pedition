import sys

path = r'c:\Users\SFG DESIGN\Desktop\tour-mazex-pedition\src\pages\AdminDashboard.jsx'
with open(path, 'r', encoding='utf-8') as f:
    content = f.read()

new_content = content.replace(
    '{activeTab === "settings" && <SiteSettings />}',
    """{activeTab === "reputation" && <ReputationGuardianManager />}
          {activeTab === "lead-inbox" && <LeadInboxManager />}
          {activeTab === "email-inbox" && <UnifiedInboxManager />}
          {activeTab === "campaigns" && <CampaignManager />}
          {activeTab === "repurposing" && <ContentRepurposingManager />}
          {activeTab === "social-posts" && <SocialPostsManager />}
          {activeTab === "social-accounts" && <SocialAccountsManager />}
          {activeTab === "guide-drivers" && <GuideDriverManager />}
          {activeTab === "accommodations" && <AccommodationManager />}
          {activeTab === "airport-pickups" && <AirportPickupManager />}
          {activeTab === "partners" && <PartnerPortalManager />}
          {activeTab === "payments" && <PaymentAutomationManager />}
          {activeTab === "dynamic-pricing" && <DynamicPricingManager />}
          {activeTab === "competitor-intelligence" && <CompetitorIntelligenceManager />}
          {activeTab === "language-assistant" && <TravelerAssistanceManager />}
          {activeTab === "subscription" && <SubscriptionManager />}
          {activeTab === "settings" && <SiteSettings />}"""
)

with open(path, 'w', encoding='utf-8') as f:
    f.write(new_content)

print("Successfully updated AdminDashboard.jsx")
