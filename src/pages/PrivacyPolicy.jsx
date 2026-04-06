import React from 'react';
import SEO from '../components/UI/SEO';

const PrivacyPolicy = () => {
    return (
        <div className="pt-32 pb-20 bg-gray-50">
            <SEO 
                title="Privacy Policy"
                description="Our privacy policy details how we handle your personal data and protect your privacy when using our luxury safari services."
            />
            <div className="container max-w-4xl mx-auto px-4">
                <div className="bg-white p-8 md:p-12 rounded-[40px] shadow-xl border border-gray-100">
                    <h1 className="text-4xl font-black text-gray-900 uppercase tracking-tighter mb-8 border-l-8 border-primary pl-6">
                        Privacy Policy
                    </h1>
                    
                    <div className="prose prose-lg text-gray-600 space-y-6">
                        <section>
                            <h2 className="text-2xl font-black text-gray-900 uppercase tracking-tight mb-4">1. Introduction</h2>
                            <p>
                                Welcome to Makolo Afrika (operated as Mazex Pedition). We respect your privacy and are committed to protecting your personal data. This privacy policy will inform you as to how we look after your personal data when you visit our website.
                            </p>
                        </section>

                        <section>
                            <h2 className="text-2xl font-black text-gray-900 uppercase tracking-tight mb-4">2. The Data We Collect</h2>
                            <p>
                                We may collect, use, store and transfer different kinds of personal data about you which we have grouped together as follows:
                            </p>
                            <ul className="list-disc pl-6 space-y-2">
                                <li><strong>Identity Data:</strong> includes first name, last name, username.</li>
                                <li><strong>Contact Data:</strong> includes email address and telephone numbers.</li>
                                <li><strong>Technical Data:</strong> includes internet protocol (IP) address, browser type and version, time zone setting and location.</li>
                                <li><strong>Usage Data:</strong> includes information about how you use our website, products and services.</li>
                            </ul>
                        </section>

                        <section>
                            <h2 className="text-2xl font-black text-gray-900 uppercase tracking-tight mb-4">3. How We Use Your Data</h2>
                            <p>
                                We will only use your personal data when the law allows us to. Most commonly, we will use your personal data in the following circumstances:
                            </p>
                            <ul className="list-disc pl-6 space-y-2">
                                <li>To register you as a new customer.</li>
                                <li>To process and deliver your safari bookings.</li>
                                <li>To manage our relationship with you.</li>
                                <li>To use data analytics to improve our website, services, and experiences.</li>
                            </ul>
                        </section>

                        <section>
                            <h2 className="text-2xl font-black text-gray-900 uppercase tracking-tight mb-4">4. Data Security</h2>
                            <p>
                                We have put in place appropriate security measures to prevent your personal data from being accidentally lost, used or accessed in an unauthorized way, altered or disclosed.
                            </p>
                        </section>

                        <section>
                            <h2 className="text-2xl font-black text-gray-900 uppercase tracking-tight mb-4">5. Contact Us</h2>
                            <p>
                                If you have any questions about this privacy policy or our privacy practices, please contact us at: <br/>
                                <strong>Email:</strong> info@tanzaniainsideandsafari.com <br/>
                                <strong>Address:</strong> NSSF building 2nd Floor, Room no 14, Aga Khan Rd, Moshi, Kilimanjaro.
                            </p>
                        </section>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PrivacyPolicy;
