import React, { useState } from 'react';
import IntroVideo from '../components/intro/IntroVideo';
import Navbar from '../components/layout/Navbar';

const Home = () => {
  const [isIntroComplete, setIsIntroComplete] = useState(false);

  return (
    <div className="min-h-screen bg-[#050505] text-white">
      {/* Intro Video Overlay */}
      {!isIntroComplete && (
        <IntroVideo onComplete={() => setIsIntroComplete(true)} />
      )}

      {/* Main Navigation */}
      <Navbar isVisible={isIntroComplete} />

      {/* Main Content - Only revealed when intro completes */}
      <main 
        className={`pt-24 px-6 max-w-7xl mx-auto transition-opacity duration-1000 ease-in-out ${
          isIntroComplete ? 'opacity-100' : 'opacity-0'
        }`}
        aria-hidden={!isIntroComplete}
      >
        <section className="py-20 text-center">
          <h2 className="text-5xl font-light tracking-wide mb-6">
            ĐỊNH NGHĨA LẠI SỰ DI CHUYỂN
          </h2>
          <p className="text-gray-400 text-lg max-w-2xl mx-auto mb-10">
            Trải nghiệm dịch vụ thuê xe tự lái cao cấp với những dòng xe sang trọng bậc nhất. 
            Tự do khám phá mọi hành trình theo cách riêng của bạn.
          </p>
          <a href="/cars" className="inline-block bg-transparent border border-white px-8 py-3 text-sm font-medium hover:bg-white hover:text-black transition-colors uppercase tracking-widest">
            Khám phá bộ sưu tập
          </a>
        </section>

        {/* Placeholder for more content */}
        <section className="py-20 grid grid-cols-1 md:grid-cols-3 gap-8">
          {[1, 2, 3].map(i => (
            <div key={i} className="aspect-[4/3] bg-zinc-900 flex items-center justify-center border border-zinc-800">
              <span className="text-zinc-600">Hình ảnh xe {i}</span>
            </div>
          ))}
        </section>
      </main>
    </div>
  );
};

export default Home;
