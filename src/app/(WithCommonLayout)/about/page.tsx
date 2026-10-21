import About from "@/components/Homepages/About";
import Quote from "@/components/Homepages/Quote";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "TutorLink | About",
  description: "TutorLink helps you to find Best tutors",
};

const AboutPage = () => {
  return (
    <div className="">
      <About />
      <Quote />
    </div>
  );
};

export default AboutPage;
