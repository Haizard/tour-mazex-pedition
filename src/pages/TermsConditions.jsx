import React from 'react';
import SEO from '../components/UI/SEO';

const TermsConditions = () => {
    return (
        <div className="pt-32 pb-20 bg-gray-50">
            <SEO 
                title="Terms & Conditions"
                description="Read our terms and conditions for booking tours and safaris in Tanzania with Makolo Afrika."
            />
            <div className="container max-w-4xl mx-auto px-4">
                <div className="bg-white p-8 md:p-12 rounded-[40px] shadow-xl border border-gray-100">
                    <h1 className="text-4xl font-black text-gray-900 uppercase tracking-tighter mb-8 border-l-8 border-primary pl-6">
                        Terms & Conditions
                    </h1>
                    
                    <div className="prose prose-lg text-gray-600 space-y-6">
                        <section>
                            <h2 className="text-2xl font-black text-gray-900 uppercase tracking-tight mb-4">1. Acceptance of Terms</h2>
                            <p>
                                By accessing or using the website at makoloafrika.com, you agree to comply with and be bound by these Terms and Conditions. These terms apply to all visitors, users, and others who access or use the Service.
                            </p>
                        </section>

                        <section>
                            <h2 className="text-2xl font-black text-gray-900 uppercase tracking-tight mb-4">2. Tour Bookings</h2>
                            <p>
                                When you book a tour or safari through our platform, you are entering into a contract with Mazex Pedition. You must provide us with information that is accurate, complete, and current at all times.
                            </p>
                        </section>

                        <section>
                            <h2 className="text-2xl font-black text-gray-900 uppercase tracking-tight mb-4">3. Payments & Cancellations</h2>
                            <p>
                                Payment terms are specified at the time of booking. Cancellations are subject to the specific itinerary policies. We recommend that all our travelers obtain comprehensive travel insurance.
                            </p>
                        </section>

                        <section>
                            <h2 className="text-2xl font-black text-gray-900 uppercase tracking-tight mb-4">4. Limitation of Liability</h2>
                            <p>
                                Mazex Pedition shall not be liable for any indirect, incidental, special, consequential, or punitive damages, including without limitation, loss of profits, data, use, goodwill, or other intangible losses.
                            </p>
                        </section>

                        <section>
                            <h2 className="text-2xl font-black text-gray-900 uppercase tracking-tight mb-4">5. Governing Law</h2>
                            <p>
                                These Terms shall be governed and construed in accordance with the laws of Tanzania, without regard to its conflict of law provisions.
                            </p>
                        </section>

                        <section>
                            <h2 className="text-2xl font-black text-gray-900 uppercase tracking-tight mb-4">6. Changes to Terms</h2>
                            <p>
                                We reserve the right, at our sole discretion, to modify or replace these Terms at any time. What constitutes a material change will be determined at our sole discretion.
                            </p>
                        </section>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default TermsConditions;
