#pragma once

class Utilities
{
public:
    inline static LARGE_INTEGER JsTimestampToLargeInteger(int64_t jsTimestamp)
    {
        const int64_t EPOCH_DIFFERENCE = 11644473600000LL;
        const int64_t MS_TO_100NS = 10000LL;

        int64_t windowsTime = (jsTimestamp + EPOCH_DIFFERENCE) * MS_TO_100NS;

        LARGE_INTEGER largeInteger;
        largeInteger.LowPart = static_cast<DWORD>(windowsTime & 0xFFFFFFFF);
        largeInteger.HighPart = static_cast<DWORD>((windowsTime >> 32) & 0xFFFFFFFF);

        return largeInteger;
    }

    inline static LARGE_INTEGER LongLongToLargeInteger(_In_ const LONGLONG longlong)
    {
        LARGE_INTEGER largeInteger;
        largeInteger.QuadPart = longlong;
        return largeInteger;
    }
};
