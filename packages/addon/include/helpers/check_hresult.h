#pragma once

inline void check_hresult(const char* key, HRESULT hr)
{
    try {
        winrt::check_hresult(hr);
    } catch (const winrt::hresult_error& e) {
        std::string msg = std::string("[") + key + "] " + winrt::to_string(e.message());
        throw winrt::hresult_error(e.code(), winrt::to_hstring(msg));
    }
}
