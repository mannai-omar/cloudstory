import { Navbar } from "./components/Navbar";
import { Hero } from "./components/Hero";
import { Story } from "./components/Story";
import { Journey } from "./components/Journey";
import { Explore } from "./components/Explore";
import { OperationsRoom } from "./components/OperationsRoom";
import { BehindTheBuild, Footer } from "./components/BehindTheBuild";

export default function App() {
  return (
    <>
      <header>
        <Navbar />
      </header>
      <main>
        <Hero />
        <Story />
        <Journey />
        <Explore />
        <OperationsRoom />
        <BehindTheBuild />
      </main>
      <Footer />
    </>
  );
}
