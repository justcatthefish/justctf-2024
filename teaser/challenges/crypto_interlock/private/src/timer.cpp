#include <chrono>
#include <iostream>
#include <string>
#include <random>


class MyClock {
public:
    typedef std::chrono::nanoseconds duration;
    typedef duration::rep rep;
    typedef duration::period period;
    typedef std::chrono::time_point<MyClock> time_point;

    static time_point now() noexcept
    {
        return time_point(std::chrono::duration_cast<duration>(std::chrono::utc_clock::now().time_since_epoch()) - startTime);
    }

private:
    static duration startTime;
    static const bool is_steady = true;
};

using namespace std::chrono;
using namespace std;

// we fake time to be in the past
std::random_device rd;
std::mt19937 gen(rd());
std::uniform_int_distribution<> minDistr(45, 55);
std::uniform_int_distribution<> secDistr(0, 59);
MyClock::duration MyClock::startTime = duration_cast<MyClock::duration>(
    system_clock::now() - sys_days{December/31/1990} - 23h - minutes(minDistr(gen)) - seconds(secDistr(gen))
);

int main() {
    string ins = "";
    while (ins != "q") {
        cin >> ins;
        cout << time_point<utc_clock>(MyClock::now().time_since_epoch()) << endl;    
    }
}