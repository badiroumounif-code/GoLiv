import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Toaster } from "./components/ui/sonner";
import { AuthProvider } from "./context/AuthContext";
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
import LoginPage from "./pages/LoginPage";
import RiderDashboard from "./pages/RiderDashboard";
import MerchantDashboard from "./pages/MerchantDashboard";
import FAQ from "./pages/FAQ";

function App() {
  return (
    <div className="App min-h-screen bg-white">
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Layout />}>
              <Route index element={<Home />} />
              <Route path="comment-ca-marche" element={<HowItWorks />} />
              <Route path="services" element={<Services />} />
              <Route path="a-propos" element={<About />} />
              <Route path="contact" element={<Contact />} />
              <Route path="faq" element={<FAQ />} />
              <Route path="demande-livraison" element={<DeliveryRequest />} />
              <Route path="donner-avis" element={<Feedback />} />
              <Route path="devenir-partenaire/commercant" element={<PartnerMerchant />} />
              <Route path="devenir-partenaire/livreur" element={<PartnerRider />} />
              <Route path="admin" element={<Admin />} />
              <Route path="connexion" element={<LoginPage />} />
              <Route path="espace-livreur" element={<RiderDashboard />} />
              <Route path="espace-commercant" element={<MerchantDashboard />} />
            </Route>
          </Routes>
        </BrowserRouter>
        <Toaster position="top-center" richColors />
      </AuthProvider>
    </div>
  );
}

export default App;
