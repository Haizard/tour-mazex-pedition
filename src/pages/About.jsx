import React from "react";
import Card from "../components/UI/Card";
import Badge from "../components/UI/Badge";
import { fetchVisionaries } from "../services/api";

const About = () => {
  const [visionaries, setVisionaries] = React.useState([]);

  React.useEffect(() => {
    const loadVisionaries = async () => {
      try {
        const res = await fetchVisionaries();
        setVisionaries(res.data);
      } catch (error) {
        console.error("Error loading visionaries:", error);
      }
    };
    loadVisionaries();
  }, []);
  return (
    <div className="bg-white">
      {/* Hero Section */}
      <div className="relative h-[50vh] flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0 bg-black/50 z-10" />
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1516026672322-bc52d61a55d5?q=80&w=1920&auto=format&fit=crop')] bg-cover bg-center" />
        <div className="container relative z-20 text-center text-white">
          <Badge variant="secondary" className="mb-4">
            Our Story
          </Badge>
          <h1 className="text-5xl md:text-7xl font-black uppercase tracking-tighter font-heading">
            The Makolo <span className="text-primary italic">Heritage</span>
          </h1>
        </div>
      </div>

      <div className="container py-24">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-16 items-start">
          {/* Left Column: About Us */}
          <div className="lg:col-span-7 space-y-8">
            <div className="space-y-4">
              <p className="text-primary font-black uppercase tracking-widest text-sm">
                Who We Are
              </p>
              <h2 className="text-4xl font-black font-heading leading-tight uppercase">
                Crafting Unforgettable <br /> African Adventures
              </h2>
            </div>

            <p className="text-gray-600 text-lg leading-relaxed font-medium">
              At Makolo Safari, we are dedicated to crafting unforgettable
              African adventures. Founded with a passion for the wild, our goal
              is to connect you with the continent's stunning landscapes,
              diverse wildlife, and rich cultures.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-8">
              <div className="space-y-4">
                <h3 className="text-xl font-black font-heading flex items-center gap-2">
                  <span className="w-1.5 h-6 bg-primary rounded-full" />
                  OUR MISSION
                </h3>
                <p className="text-gray-500 text-sm leading-relaxed">
                  We offer bespoke safari experiences and cultural tours that
                  are tailored to your interests. From witnessing the Great
                  Migration to exploring the Ngorongoro Crater, our expert team
                  ensures every journey is exceptional.
                </p>
              </div>
              <div className="space-y-4">
                <h3 className="text-xl font-black font-heading flex items-center gap-2">
                  <span className="w-1.5 h-6 bg-secondary rounded-full" />
                  OUR VALUES
                </h3>
                <ul className="space-y-2 text-gray-500 text-sm">
                  <li className="flex items-center gap-2 font-bold">
                    <span className="text-primary">✓</span> Authenticity:
                    Genuine immersion.
                  </li>
                  <li className="flex items-center gap-2 font-bold">
                    <span className="text-primary">✓</span> Sustainability:
                    Responsible travel.
                  </li>
                  <li className="flex items-center gap-2 font-bold">
                    <span className="text-primary">✓</span> Personalization:
                    Tailored for you.
                  </li>
                </ul>
              </div>
            </div>
          </div>

          {/* Right Column: Operators */}
          <div className="lg:col-span-5 space-y-10">
            <div className="bg-gray-50 p-10 rounded-[40px] border border-gray-100 shadow-sm">
              <h3 className="text-2xl font-black font-heading mb-10 text-center uppercase tracking-tight">
                The Visionaries
              </h3>
              <div className="space-y-8">
                {visionaries.length > 0 ? (
                  visionaries.map((operator) => (
                    <div
                      key={operator._id}
                      className="flex items-center gap-6 group"
                    >
                      <div className="relative">
                        <div className="absolute inset-0 bg-primary/20 rounded-full scale-110 blur-sm opacity-0 group-hover:opacity-100 transition-opacity" />
                        <img
                          src={operator.image}
                          alt={operator.name}
                          className="w-20 h-20 rounded-full object-cover relative z-10 border-2 border-white shadow-md transition-transform group-hover:scale-105"
                        />
                      </div>
                      <div>
                        <h4 className="text-lg font-black text-gray-900 group-hover:text-primary transition-colors">
                          {operator.name}
                        </h4>
                        <p className="text-gray-500 text-xs font-black uppercase tracking-widest">
                          {operator.duty}
                        </p>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-center text-gray-400 font-bold uppercase text-[10px] tracking-widest py-10">
                    No visionaries added yet.
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Location Section */}
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
            <div className="p-8 bg-background text-white flex flex-col md:flex-row justify-between items-center gap-8">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-primary/20 rounded-2xl flex items-center justify-center text-primary text-xl">
                  📍
                </div>
                <div>
                  <p className="font-black uppercase tracking-widest text-xs opacity-60">
                    Location
                  </p>
                  <p className="text-lg font-bold">
                    Moshi, Tanzania, East Africa
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-secondary/20 rounded-2xl flex items-center justify-center text-secondary text-xl">
                  📧
                </div>
                <div>
                  <p className="font-black uppercase tracking-widest text-xs opacity-60">
                    Email
                  </p>
                  <p className="text-lg font-bold">hello@makolosafari.com</p>
                </div>
              </div>
            </div>
          </Card>
        </section>
      </div>
    </div>
  );
};

export default About;
