import React from 'react';
import { useTranslation } from 'react-i18next';

const CityRallyPage = () => {
  const { t, i18n } = useTranslation();

  // Check if current language is Thai
  const isThaiLanguage = i18n.language === 'th';

  // Force Anuphan font for all text when in Thai language
  const getAnuphanClass = (baseClass: string) => {
    if (isThaiLanguage) {
      return `${baseClass}-th`; // This will use Anuphan font
    }
    return `${baseClass}-en`; // This will use Raleway font for English
  };

  return (
    <div className="min-h-screen bg-[#110D16] text-white pt-20 sm:pt-24">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-[#AA4626]/20 via-[#FCB283]/10 to-transparent"></div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-20">
          <div className="text-center">
            <div className="inline-flex items-center gap-3 mb-6">
              <span className="text-4xl">🎪</span>
              <h1 className={`text-4xl sm:text-5xl lg:text-6xl font-bold bg-gradient-to-r from-[#FCB283] to-[#AA4626] bg-clip-text text-transparent ${getAnuphanClass('heading')}`}>
                {isThaiLanguage ? 'กติกา CIFAN City Rally' : 'CIFAN City Rally'}
              </h1>
            </div>
            <p className={`text-xl sm:text-2xl text-white/80 mb-4 ${getAnuphanClass('subtitle')}`}>
              {isThaiLanguage ? 'เที่ยวเชียงใหม่ ชิงรางวัลใหญ่!' : 'Explore Chiang Mai & Win Big!'}
            </p>
            <div className="flex items-center justify-center gap-2 text-[#FCB283]">
              <span className={`text-lg font-medium ${getAnuphanClass('body')}`}>
                {isThaiLanguage ? '20-27 กันยายน 2568' : 'September 20–27, 2025'}
              </span>
              <span className="w-2 h-2 bg-[#FCB283] rounded-full"></span>
              <span className={`text-lg font-medium ${getAnuphanClass('body')}`}>
                {isThaiLanguage ? 'ระหว่างเทศกาลภาพยนตร์ CIFAN 2025' : 'During CIFAN 2025 Film Festival'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Rules Section */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="glass-container rounded-2xl p-8 sm:p-12">
          
          {/* 4 Easy Steps */}
          <div className="mb-16">
            <div className="text-center mb-12">
              <h2 className={`text-3xl sm:text-4xl font-bold text-white mb-4 ${getAnuphanClass('heading')}`}>
                {isThaiLanguage ? '🎯 วิธีเล่นง่ายๆ 4 ขั้นตอน' : '🎯 4 Easy Steps to Play'}
              </h2>
            </div>
            
            <div className="grid md:grid-cols-2 gap-8">
              {/* Step 1 */}
              <div className="bg-white/5 rounded-xl p-6 border border-white/10 hover:border-[#FCB283]/30 transition-all duration-300">
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 w-12 h-12 bg-gradient-to-r from-[#FCB283] to-[#AA4626] rounded-full flex items-center justify-center text-white font-bold text-lg">
                    1️⃣
                  </div>
                  <div>
                    <h3 className={`text-xl font-bold text-white mb-3 ${getAnuphanClass('heading')}`}>
                      {isThaiLanguage ? 'รับ Passport' : 'Get Your Passport'}
                    </h3>
                    <p className={`text-white/80 leading-relaxed ${getAnuphanClass('body')}`}>
                      {isThaiLanguage ? 'รับฟรีที่งานเทศกาลหรือร้านค้าที่ร่วมโครงการ' : 'Pick it up for free at the festival or at participating shops.'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Step 2 */}
              <div className="bg-white/5 rounded-xl p-6 border border-white/10 hover:border-[#FCB283]/30 transition-all duration-300">
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 w-12 h-12 bg-gradient-to-r from-[#FCB283] to-[#AA4626] rounded-full flex items-center justify-center text-white font-bold text-lg">
                    2️⃣
                  </div>
                  <div>
                    <h3 className={`text-xl font-bold text-white mb-3 ${getAnuphanClass('heading')}`}>
                      {isThaiLanguage ? 'ไปใช้บริการร้านค้า' : 'Visit Shops'}
                    </h3>
                    <div className={`text-white/80 leading-relaxed ${getAnuphanClass('body')}`}>
                      <p className="mb-2">
                        {isThaiLanguage ? 'ซื้อของ/ใช้บริการที่ร้านที่มีสติกเกอร์ CIFAN' : 'Make a purchase at shops with the CIFAN sticker.'}
                      </p>
                      <p className="text-[#FCB283] font-medium">
                        {isThaiLanguage ? 'ได้ stamp ร้านละ 1 ดวงต่อการซื้อ 1 ครั้ง' : 'Earn 1 stamp per purchase per shop.'}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Step 3 */}
              <div className="bg-white/5 rounded-xl p-6 border border-white/10 hover:border-[#FCB283]/30 transition-all duration-300">
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 w-12 h-12 bg-gradient-to-r from-[#FCB283] to-[#AA4626] rounded-full flex items-center justify-center text-white font-bold text-lg">
                    3️⃣
                  </div>
                  <div>
                    <h3 className={`text-xl font-bold text-white mb-3 ${getAnuphanClass('heading')}`}>
                      {isThaiLanguage ? 'แชร์โซเชียล' : 'Share on Social Media'}
                    </h3>
                    <div className={`text-white/80 leading-relaxed ${getAnuphanClass('body')}`}>
                      <p className="mb-2">
                        {isThaiLanguage ? 'ถ่ายรูปโพสต์ IG @CIFANFest' : 'Post a photo on IG @CIFANFest'}
                      </p>
                      <p className="text-[#FCB283] font-medium">
                        {isThaiLanguage ? 'ใส่แฮชแท็ก #CIFAN2025 #CityRally #ชื่อร้าน #ชื่อIGตัวเอง' : 'Use hashtags #CIFAN2025 #CityRally #ShopName #YourIGName'}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Step 4 */}
              <div className="bg-white/5 rounded-xl p-6 border border-white/10 hover:border-[#FCB283]/30 transition-all duration-300">
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 w-12 h-12 bg-gradient-to-r from-[#FCB283] to-[#AA4626] rounded-full flex items-center justify-center text-white font-bold text-lg">
                    4️⃣
                  </div>
                  <div>
                    <h3 className={`text-xl font-bold text-white mb-3 ${getAnuphanClass('heading')}`}>
                      {isThaiLanguage ? 'ส่งผลประกวด' : 'Submit Your Entry'}
                    </h3>
                    <div className={`text-white/80 leading-relaxed ${getAnuphanClass('body')}`}>
                      <p className="mb-1">
                        {isThaiLanguage ? 'ส่งหน้า Passport ที่มี stamp ก่อน 15 ตุลาคม' : 'Submit your Passport with stamps before October 15'}
                      </p>
                      <p className="text-[#FCB283] font-medium">
                        {isThaiLanguage ? 'รอประกาศผลรางวัล' : 'Wait for prize announcement'}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Grand Prizes */}
          <div className="mb-16">
            <div className="text-center mb-12">
              <h2 className={`text-3xl sm:text-4xl font-bold text-white mb-4 ${getAnuphanClass('heading')}`}>
                {isThaiLanguage ? '🏆 รางวัลใหญ่รออยู่!' : '🏆 Grand Prizes Await!'}
              </h2>
            </div>
            
            <div className="grid md:grid-cols-2 gap-6 mb-8">
              {/* 1st Prize */}
              <div className="bg-gradient-to-br from-yellow-500/20 to-yellow-600/10 rounded-xl p-6 border border-yellow-500/30">
                <div className="text-center">
                  <div className="text-4xl mb-4">🥇</div>
                  <h3 className={`text-2xl font-bold text-yellow-400 mb-2 ${getAnuphanClass('heading')}`}>
                    {isThaiLanguage ? 'รางวัลที่ 1' : '1st Prize'}
                  </h3>
                  <p className={`text-3xl font-bold text-white mb-4 ${getAnuphanClass('heading')}`}>
                    {isThaiLanguage ? 'iPhone AIR' : 'iPhone AIR'}
                  </p>
                  <div className={`text-white/80 ${getAnuphanClass('body')}`}>
                    <p className="font-medium text-yellow-300">
                      {isThaiLanguage ? 'เงื่อนไข' : 'Condition'}
                    </p>
                    <p>
                      {isThaiLanguage ? 'ต้องมี stamp 20+ ร้าน, ร่วมจับลฉลาก' : 'Collect 20+ shop stamps, enter lucky draw'}
                    </p>
                  </div>
                </div>
              </div>

              {/* 2nd Prize */}
              <div className="bg-gradient-to-br from-gray-400/20 to-gray-500/10 rounded-xl p-6 border border-gray-400/30">
                <div className="text-center">
                  <div className="text-4xl mb-4">🥈</div>
                  <h3 className={`text-2xl font-bold text-gray-300 mb-2 ${getAnuphanClass('heading')}`}>
                    {isThaiLanguage ? 'ใช้จ่ายมากที่สุด' : 'Top Spender'}
                  </h3>
                  <p className={`text-3xl font-bold text-white mb-4 ${getAnuphanClass('heading')}`}>
                    {isThaiLanguage ? 'iPhone 17 Pro' : 'iPhone 17 Pro'}
                  </p>
                  <div className={`text-white/80 ${getAnuphanClass('body')}`}>
                    <p className="font-medium text-gray-300">
                      {isThaiLanguage ? 'เงื่อนไข' : 'Condition'}
                    </p>
                    <p>
                      {isThaiLanguage ? 'Top Spender (ใช้จ่ายมากสุด)' : 'Top Spender (highest total spending)'}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="text-center">
              <p className={`text-xl text-[#FCB283] font-bold ${getAnuphanClass('heading')}`}>
                {isThaiLanguage ? '+ รางวัลเสริมอื่นๆ อีกมากมาย' : '+ Many more bonus prizes!'}
              </p>
            </div>
          </div>

          {/* Participating Shops */}
          <div className="mb-16">
            <div className="text-center mb-12">
              <h2 className={`text-3xl sm:text-4xl font-bold text-white mb-4 ${getAnuphanClass('heading')}`}>
                {isThaiLanguage ? '📍 ร้านค้าที่เข้าร่วม' : '📍 Participating Shops'}
              </h2>
            </div>
            
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
              <div className="bg-white/5 rounded-lg p-4 border border-white/10">
                <div className="flex items-center gap-3">
                  <span className="text-green-400 text-xl">✅</span>
                  <span className={`text-white font-medium ${getAnuphanClass('body')}`}>
                    {isThaiLanguage ? 'ร้านอาหาร & คาเฟ่' : 'Restaurants & Cafés'}
                  </span>
                </div>
              </div>
              <div className="bg-white/5 rounded-lg p-4 border border-white/10">
                <div className="flex items-center gap-3">
                  <span className="text-green-400 text-xl">✅</span>
                  <span className={`text-white font-medium ${getAnuphanClass('body')}`}>
                    {isThaiLanguage ? 'โรงแรม & ที่พัก' : 'Hotels & Accommodations'}
                  </span>
                </div>
              </div>
              <div className="bg-white/5 rounded-lg p-4 border border-white/10">
                <div className="flex items-center gap-3">
                  <span className="text-green-400 text-xl">✅</span>
                  <span className={`text-white font-medium ${getAnuphanClass('body')}`}>
                    {isThaiLanguage ? 'ร้านหัตถกรรม & ของฝาก' : 'Handicraft & Souvenir Shops'}
                  </span>
                </div>
              </div>
              <div className="bg-white/5 rounded-lg p-4 border border-white/10">
                <div className="flex items-center gap-3">
                  <span className="text-green-400 text-xl">✅</span>
                  <span className={`text-white font-medium ${getAnuphanClass('body')}`}>
                    {isThaiLanguage ? 'นวด & สปา' : 'Massage & Spas'}
                  </span>
                </div>
              </div>
              <div className="bg-white/5 rounded-lg p-4 border border-white/10">
                <div className="flex items-center gap-3">
                  <span className="text-green-400 text-xl">✅</span>
                  <span className={`text-white font-medium ${getAnuphanClass('body')}`}>
                    {isThaiLanguage ? 'โรงภาพยนตร์' : 'Cinemas'}
                  </span>
                </div>
              </div>
            </div>

            <div className="text-center">
              <p className={`text-2xl font-bold text-[#FCB283] ${getAnuphanClass('heading')}`}>
                {isThaiLanguage ? '100+ ร้านค้าทั่วเมืองเชียงใหม่' : '100+ shops across Chiang Mai city'}
              </p>
            </div>
          </div>

          {/* City Rally Map Section */}
          <div className="mb-16">
            <div className="text-center mb-12">
              <h2 className={`text-3xl sm:text-4xl font-bold text-white mb-4 ${getAnuphanClass('heading')}`}>
                {isThaiLanguage ? '🗺️ แผนที่ City Rally' : '🗺️ City Rally Map'}
              </h2>
            </div>
            
            <div className="bg-white/5 rounded-xl p-12 border border-white/10 text-center">
              <div className="text-6xl mb-6">🗺️</div>
              <h3 className={`text-2xl font-bold text-white mb-4 ${getAnuphanClass('heading')}`}>
                {isThaiLanguage ? 'เร็วๆ นี้' : 'Coming Soon'}
              </h3>
              <p className={`text-white/70 text-lg ${getAnuphanClass('body')}`}>
                {isThaiLanguage ? 'แผนที่แบบอินเตอร์แอคทีฟที่แสดงร้านค้าที่เข้าร่วมทั้งหมดและตำแหน่งของร้านจะเปิดให้บริการเร็วๆ นี้' : 'Interactive map showing all participating shops and their locations will be available soon.'}
              </p>
            </div>
          </div>

          {/* Event Period */}
          <div className="mb-16">
            <div className="text-center mb-8">
              <h2 className={`text-3xl sm:text-4xl font-bold text-white mb-4 ${getAnuphanClass('heading')}`}>
                {isThaiLanguage ? '⏰ ระยะเวลาจัดงาน' : '⏰ Event Period'}
              </h2>
            </div>
            
            <div className="bg-gradient-to-r from-[#FCB283]/20 to-[#AA4626]/20 rounded-xl p-8 border border-[#FCB283]/30 text-center">
              <p className={`text-2xl font-bold text-white mb-2 ${getAnuphanClass('heading')}`}>
                {isThaiLanguage ? '20-27 กันยายน 2568' : 'September 20–27, 2025'}
              </p>
              <p className={`text-lg text-[#FCB283] ${getAnuphanClass('body')}`}>
                {isThaiLanguage ? 'ระหว่างเทศกาลภาพยนตร์ CIFAN 2025' : 'During the CIFAN 2025 Film Festival'}
              </p>
            </div>
          </div>

          {/* Tips to Win */}
          <div className="mb-16">
            <div className="text-center mb-12">
              <h2 className={`text-3xl sm:text-4xl font-bold text-white mb-4 ${getAnuphanClass('heading')}`}>
                {isThaiLanguage ? '💡 เคล็ดลับการชนะ' : '💡 Tips to Win'}
              </h2>
            </div>
            
            <div className="grid sm:grid-cols-2 gap-6">
              <div className="bg-white/5 rounded-lg p-6 border border-white/10">
                <div className="flex items-start gap-3">
                  <span className="text-[#FCB283] text-xl">📍</span>
                  <p className={`text-white/80 ${getAnuphanClass('body')}`}>
                    {isThaiLanguage ? 'เก็บ stamp ให้ได้มากที่สุด' : 'Collect as many stamps as possible'}
                  </p>
                </div>
              </div>
              <div className="bg-white/5 rounded-lg p-6 border border-white/10">
                <div className="flex items-start gap-3">
                  <span className="text-[#FCB283] text-xl">📱</span>
                  <p className={`text-white/80 ${getAnuphanClass('body')}`}>
                    {isThaiLanguage ? 'แชร์ทุกร้านที่ไปเยือน' : 'Share every shop you visit'}
                  </p>
                </div>
              </div>
              <div className="bg-white/5 rounded-lg p-6 border border-white/10">
                <div className="flex items-start gap-3">
                  <span className="text-[#FCB283] text-xl">🏪</span>
                  <p className={`text-white/80 ${getAnuphanClass('body')}`}>
                    {isThaiLanguage ? 'ไปครบทุกประเภทร้านค้า' : 'Cover all shop categories'}
                  </p>
                </div>
              </div>
              <div className="bg-white/5 rounded-lg p-6 border border-white/10">
                <div className="flex items-start gap-3">
                  <span className="text-[#FCB283] text-xl">👥</span>
                  <p className={`text-white/80 ${getAnuphanClass('body')}`}>
                    {isThaiLanguage ? 'ติดตาม @CIFANFest เพื่ออัปเดต' : 'Follow @CIFANFest for updates'}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Call to Action */}
          <div className="text-center">
            <div className="bg-gradient-to-r from-[#AA4626] to-[#FCB283] rounded-xl p-8">
              <h2 className={`text-2xl sm:text-3xl font-bold text-white mb-4 ${getAnuphanClass('heading')}`}>
                {isThaiLanguage ? '🎬 ร่วมเทศกาลภาพยนตร์สุดยอด' : '🎬 Join the Fantastic Film Festival'}
              </h2>
              <p className={`text-lg text-white/90 ${getAnuphanClass('body')}`}>
                {isThaiLanguage ? 'และสำรวจเชียงใหม่ในแบบที่ไม่เคยมีมาก่อน!' : 'and explore Chiang Mai in a whole new way!'}
              </p>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default CityRallyPage;
