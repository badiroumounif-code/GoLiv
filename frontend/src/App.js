import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Toaster } from "./components/ui/sonner";
import Layout from "./components/Layout";
import Home from "./pages/Home";
import HowItWorks from "./pages/HowItWorks";
import Services from "./pages/Services";
import About from "./pages/About";
import Contact from "./pages/Contact";
import DeliveryRequest from "./pages/DeliveryRequest";
import Feedback from "./pages/Feedback";
import PartnerMerchant from "./pages/PartnerMerchant";
import PartnerRider from "./pages/PartnerRider";
import Admin from "./pages/Admin";

function App() {
  return (
    <div className="App min-h-screen bg-white">
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Layout />}>
            <Route index element={<Home />} />
            <Route path="comment-ca-marche" element={<HowItWorks />} />
            <Route path="services" element={<Services />} />
            <Route path="a-propos" element={<About />} />
            <Route path="contact" element={<Contact />} />
            <Route path="demande-livraison" element={<DeliveryRequest />} />
            <Route path="donner-avis" element={<Feedback />} />
            <Route path="devenir-partenaire/commercant" element={<PartnerMerchant />} />
            <Route path="devenir-partenaire/livreur" element={<PartnerRider />} />
            <Route path="admin" element={<Admin />} />
          </Route>
        </Routes>
      </BrowserRouter>
      <Toaster position="top-center" richColors />
    </div>
  );
}

export default App;
