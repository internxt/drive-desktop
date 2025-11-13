#ifndef WINRT_CHECK_HRESULT_WRAPPER_H
#define WINRT_CHECK_HRESULT_WRAPPER_H

#include <winrt/base.h>
#include <string>

inline void check_hresult(const char *key, HRESULT hr)
{
  try
  {
    winrt::check_hresult(hr);
  }
  catch (const winrt::hresult_error &e)
  {
    std::string msg = std::string("[") + key + "] " + winrt::to_string(e.message());
    throw winrt::hresult_error(e.code(), winrt::to_hstring(msg));
  }
}

#endif
