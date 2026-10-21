import About from "@/components/Homepages/About";
import Facts from "@/components/Homepages/Facts";
import Hero from "@/components/Homepages/Hero";
import Process from "@/components/Homepages/Process";
import Products from "@/components/Homepages/Products";
import Quote from "@/components/Homepages/Quote";
import Why from "@/components/Homepages/Why";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Gilbrice",
  description: "",
};

export default function HomePage() {
  return (
    <div className="">
      <Hero />
      <Facts />
      <Products />
      <Why />
      <About />
      <Process />
      <Quote />
    </div>
  );
}
