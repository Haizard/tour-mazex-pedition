import React from "react";
import Badge from "../components/UI/Badge";
import Card from "../components/UI/Card";
import Testimonial from "../components/Testimonial/Testimonial";
import TripCTA from "../components/Home/TripCTA";
import LogoSlider from "../components/Home/LogoSlider";
import SEO from "../components/UI/SEO";
import {
  createContactMessage,
  fetchFaqs,
  fetchVisionaries,
} from "../services/api";

const Contact = () => {
  const [visionaries, setVisionaries] = React.useState([]);
  const [faqs, setFaqs] = React.useState([]);
  const [openFaq, setOpenFaq] = React.useState(null);
  const [loading, setLoading] = React.useState(false);
  const [success, setSuccess] = React.useState(false);
  const [formData, setFormData] = React.useState({
    name: "",
    email: "",
    phone: "",
    message: "",
  });

  React.useEffect(() => {
    const loadPageData = async () => {
      try {
        const [visionariesRes, faqsRes] = await Promise.all([
          fetchVisionaries(),
          fetchFaqs(),
        ]);
        setVisionaries(visionariesRes.data);
        setFaqs(faqsRes.data);
      } catch (error) {
        console.error("Error loading contact page:", error);
      }
    };

    loadPageData();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await createContactMessage(formData);
      setSuccess(true);
      setFormData({ name: "", email: "", phone: "", message: "" });
    } catch (error) {
      console.error(error);
      alert("We could not send your message right now. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white">
      <SEO 
        title="Contact Us - Plan Your Tanzania Safari"
        description="Get in touch with MAZ Expeditions to start planning your luxury African adventure. Our experts are ready to help you design a personalized itinerary."
      />
      <div className="relative flex h-[50vh] items-center justify-center overflow-hidden">
        <div className="absolute inset-0 z-10 bg-black/50" />
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1516026672322-bc52d61a55d5?q=80&w=1920&auto=format&fit=crop')] bg-cover bg-center" />
        <div className="container relative z-20 text-center text-white">
          <Badge variant="secondary" className="mb-4">
            Contact Us
          </Badge>
          <h1 className="text-5xl font-black uppercase tracking-tighter font-heading md:text-7xl">
            MAZ <span className="text-primary italic">Expeditions</span>
          </h1>
        </div>
      </div>

      <div className="container py-24">
        <div className="grid grid-cols-1 gap-16 lg:grid-cols-12 items-start">
          <div className="space-y-8 lg:col-span-7">
            <div className="space-y-4">
              <p className="text-primary font-black uppercase tracking-widest text-sm">
                Get In Touch
              </p>
              <h2 className="text-4xl font-black font-heading leading-tight uppercase">
                Let&apos;s start planning your
                <br /> African adventure
              </h2>
            </div>

            <p className="text-gray-600 text-lg leading-relaxed font-medium">
              MAZ Expeditions creates custom African safari experiences shaped
              around the conversations we have with you. We listen carefully to
              your goals, style of travel, and dream destinations, then design
              an itinerary that feels personal from start to finish.
            </p>

            <Card className="rounded-[32px] border-none shadow-xl p-8 md:p-10">
              {success ? (
                <div className="py-12 text-center">
                  <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-green-100 text-4xl text-green-600">
                    ✓
                  </div>
                  <h3 className="text-3xl font-black uppercase tracking-tighter text-slate-900">
                    Message Sent
                  </h3>
                  <p className="mx-auto mt-4 max-w-xl text-base leading-7 text-slate-600">
                    We received your message and our team will get back to you
                    shortly.
                  </p>
                  <button
                    type="button"
                    onClick={() => setSuccess(false)}
                    className="mt-8 rounded-2xl bg-primary px-6 py-4 text-sm font-black uppercase tracking-[0.2em] text-white"
                  >
                    Send Another
                  </button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase text-gray-400 ml-2">
                      Your Name
                    </label>
                    <input
                      name="name"
                      type="text"
                      required
                      value={formData.name}
                      onChange={(e) =>
                        setFormData({ ...formData, name: e.target.value })
                      }
                      className="w-full rounded-xl bg-gray-50 p-4 outline-none focus:ring-2 focus:ring-primary"
                    />
                  </div>
                  <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase text-gray-400 ml-2">
                        E-mail
                      </label>
                      <input
                        name="email"
                        type="email"
                        required
                        value={formData.email}
                        onChange={(e) =>
                          setFormData({ ...formData, email: e.target.value })
                        }
                        className="w-full rounded-xl bg-gray-50 p-4 outline-none focus:ring-2 focus:ring-primary"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase text-gray-400 ml-2">
                        Phone
                      </label>
                      <input
                        name="phone"
                        type="text"
                        required
                        value={formData.phone}
                        onChange={(e) =>
                          setFormData({ ...formData, phone: e.target.value })
                        }
                        className="w-full rounded-xl bg-gray-50 p-4 outline-none focus:ring-2 focus:ring-primary"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase text-gray-400 ml-2">
                      Your Message
                    </label>
                    <textarea
                      name="message"
                      rows="5"
                      required
                      value={formData.message}
                      onChange={(e) =>
                        setFormData({ ...formData, message: e.target.value })
                      }
                      className="w-full rounded-2xl bg-gray-50 p-4 outline-none focus:ring-2 focus:ring-primary"
                    />
                  </div>
                  <button
                    name="submit"
                    type="submit"
                    disabled={loading}
                    className="rounded-2xl bg-primary px-8 py-4 text-sm font-black uppercase tracking-[0.2em] text-white"
                  >
                    {loading ? "Sending..." : "Send Message"}
                  </button>
                </form>
              )}
            </Card>
          </div>

          <div className="space-y-10 lg:col-span-5">
            <div className="rounded-[40px] border border-gray-100 bg-gray-50 p-10 shadow-sm">
              <h3 className="mb-10 text-center text-2xl font-black font-heading uppercase tracking-tight">
                The Visionaries
              </h3>
              <div className="space-y-8">
                {visionaries.length > 0 ? (
                  visionaries.map((operator) => (
                    <div key={operator._id} className="flex items-center gap-6 group">
                      <div className="relative">
                        <div className="absolute inset-0 rounded-full bg-primary/20 opacity-0 blur-sm transition-opacity group-hover:opacity-100" />
                        <img
                          src={operator.image}
                          alt={operator.name}
                          className="relative z-10 h-20 w-20 rounded-full border-2 border-white object-fill shadow-md transition-transform group-hover:scale-105"
                        />
                      </div>
                      <div>
                        <h4 className="text-lg font-black text-gray-900 transition-colors group-hover:text-primary">
                          {operator.name}
                        </h4>
                        <p className="text-xs font-black uppercase tracking-widest text-gray-500">
                          {operator.duty}
                        </p>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="py-10 text-center text-[10px] font-bold uppercase tracking-widest text-gray-400">
                    No visionaries added yet.
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>

        <section className="mt-24">
          <div className="text-center mb-12">
            <Badge variant="primary" className="mb-4">
              FAQ
            </Badge>
            <h2 className="m-b10 title-head text-4xl font-black uppercase tracking-tighter">
              Safari Frequently Asked <span className="text-primary">Questions</span>
            </h2>
            <p className="mx-auto mt-4 max-w-4xl text-base leading-7 text-slate-600">
              Worry out. We will take care of everything: from picking you up
              at the airport to saying a final goodbye. Below we gathered the
              answers to the most popular questions frequently asked by our
              tourists.
            </p>
          </div>

          <div className="mx-auto max-w-5xl space-y-4">
            {faqs.map((faq, index) => (
              <Card
                key={faq._id}
                className="overflow-hidden rounded-3xl border border-[#d7e4d2] bg-white shadow-sm"
              >
                <button
                  type="button"
                  onClick={() => setOpenFaq(openFaq === index ? null : index)}
                  className={`flex w-full items-center justify-between px-6 py-5 text-left transition-colors ${
                    openFaq === index ? "bg-[#f1f8ee]" : "bg-[#f8fbf6]"
                  }`}
                >
                  <div className="pr-6">
                    <p className="mb-2 text-[10px] font-black uppercase tracking-[0.3em] text-[#2f7a38]">
                      Question
                    </p>
                    <span className="text-lg font-black text-slate-900">
                      {faq.question}
                    </span>
                  </div>
                  <span className="text-2xl font-light text-primary">
                    {openFaq === index ? "−" : "+"}
                  </span>
                </button>
                {openFaq === index && (
                  <div className="border-t border-[#d7e4d2] bg-[#fff8ee] px-6 py-5">
                    <p className="mb-3 text-[10px] font-black uppercase tracking-[0.3em] text-[#b7791f]">
                      Answer
                    </p>
                    <div className="leading-7 whitespace-pre-wrap text-slate-700">
                      {faq.answer}
                    </div>
                  </div>
                )}
              </Card>
            ))}
          </div>
        </section>

        <section className="mt-32">
          <div className="text-center mb-16">
            <Badge variant="primary" className="mb-4">
              Visit Us
            </Badge>
            <h2 className="text-4xl font-black font-heading uppercase tracking-tighter">
              Our Global Headquarters
            </h2>
          </div>
          <Card className="rounded-[40px] overflow-hidden shadow-2xl border-none">
            <div className="w-full h-[500px]">
              <iframe
                src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d15932.024505825386!2d37.33322514384081!3d-3.348623974828584!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x1839d9b443856385%3A0x1584d50c63d8bccf!2sMoshi%2C%20Tanzania!5e0!3m2!1ssw!2sus!4v1722434954048!5m2!1ssw!2sus"
                width="100%"
                height="100%"
                style={{ border: 0 }}
                allowFullScreen
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
              />
            </div>
          </Card>
        </section>
      </div>

      <Testimonial />
      <div className="mt-6 md:mt-10">
        <TripCTA />
      </div>
      <LogoSlider />
    </div>
  );
};

export default Contact;
